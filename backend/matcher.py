"""企业检索匹配器

优先使用 Ollama 的嵌入模型做语义检索；若未安装嵌入模型（当前本机只有
mistral-nemo），则退化为中文关键词匹配：标签整体加权 + 中文二元词组
+ 英文/数字单词的余弦相似度，无需额外下载任何模型。
"""

import math
import re
from collections import Counter
from typing import Any

import httpx

ASCII_WORD = re.compile(r"[a-z0-9]+(?:\.[0-9]+)?")
CJK_RUN = re.compile(r"[一-鿿]+")


def _doc_text(company: dict[str, Any]) -> str:
    return " ".join(
        [
            company["name"],
            company["describe"],
            company["product"],
            " ".join(company["tags"]),
        ]
    )


def _cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def _matched_terms(query: str, company: dict[str, Any]) -> list[str]:
    """提取需求与该企业明显命中的词项，用于解释匹配原因。

    命中来源：标签整体命中 > 英文/数字单词 > 中文词组在文档中的出现。
    """
    q = query.lower()
    doc = _doc_text(company).lower()
    hits: list[str] = []
    for tag in company["tags"]:
        t = tag.lower().strip()
        if t and t in q:
            hits.append(tag)
    for w in ASCII_WORD.findall(q):
        if w and w in doc:
            hits.append(w)
    for run in CJK_RUN.findall(q):
        if run and run in doc:
            hits.append(run)

    seen: set[str] = set()
    out: list[str] = []
    for h in hits:
        key = h.lower()
        if key not in seen:
            seen.add(key)
            out.append(h)
    return out[:8]


class LexicalIndex:
    """零依赖的中文关键词索引"""

    def __init__(self, companies: list[dict[str, Any]]):
        self.companies = companies
        self.docs: list[Counter] = []
        for company in companies:
            feats: Counter = Counter()
            text = _doc_text(company).lower()
            for run in CJK_RUN.findall(text):
                for i in range(len(run) - 1):
                    feats[run[i : i + 2]] += 1.0
            for word in ASCII_WORD.findall(text):
                feats[word] += 1.0
            # 标签作为整体，权重更高
            for tag in company["tags"]:
                feats[tag.lower().strip()] += 3.0
            self.docs.append(feats)

    def search(self, query: str, top_k: int) -> list[dict[str, Any]]:
        q = query.lower()
        qf: Counter = Counter()
        for run in CJK_RUN.findall(q):
            for i in range(len(run) - 1):
                qf[run[i : i + 2]] += 1.0
        for word in ASCII_WORD.findall(q):
            qf[word] += 1.0
        qnorm = math.sqrt(sum(v * v for v in qf.values())) or 1.0

        scored: list[tuple[float, dict[str, Any]]] = []
        for company, df in zip(self.companies, self.docs):
            dot = sum(qf[k] * v for k, v in df.items() if k in qf)
            dnorm = math.sqrt(sum(v * v for v in df.values()))
            score = dot / (qnorm * dnorm) if dnorm else 0.0
            # 标签被需求原文完整命中时额外加分
            bonus = 0.0
            for tag in company["tags"]:
                if tag.lower().strip() in q:
                    bonus += 0.08
            score = max(0.0, min(1.0, score + min(bonus, 0.24)))
            scored.append((score, company))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            {**company, "score": round(score, 4), "reason": _matched_terms(query, company)}
            for score, company in scored[:top_k]
        ]


class EmbeddingIndex:
    """基于 Ollama 嵌入模型的语义索引"""

    def __init__(
        self,
        companies: list[dict[str, Any]],
        vectors: list[list[float]],
        ollama_url: str,
        model: str,
    ):
        self.companies = companies
        self.vectors = vectors
        self.ollama_url = ollama_url
        self.model = model

    async def _embed(self, client: httpx.AsyncClient, text: str) -> list[float]:
        res = await client.post(
            f"{self.ollama_url}/api/embeddings",
            json={"model": self.model, "prompt": text},
        )
        res.raise_for_status()
        return res.json()["embedding"]

    async def search(self, query: str, top_k: int) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=60.0) as client:
            qvec = await self._embed(client, query)
        scored = [
            (_cosine(qvec, vec), company)
            for vec, company in zip(self.vectors, self.companies)
        ]
        scored.sort(key=lambda x: x[0], reverse=True)
        return [
            {**company, "score": round(max(0.0, score), 4), "reason": _matched_terms(query, company)}
            for score, company in scored[:top_k]
        ]


class Matcher:
    def __init__(
        self,
        companies: list[dict[str, Any]],
        index: LexicalIndex | EmbeddingIndex,
        mode: str,
        embed_model: str | None,
    ):
        self.companies = companies
        self.index = index
        self.mode = mode  # "embedding" 或 "lexical"
        self.embed_model = embed_model

    @property
    def size(self) -> int:
        return len(self.companies)

    @classmethod
    async def create(
        cls,
        companies: list[dict[str, Any]],
        ollama_url: str,
        embed_model: str | None,
    ) -> "Matcher":
        """启动时探测：Ollama 在线且嵌入模型已安装 -> 语义索引，否则关键词索引"""
        if embed_model:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.get(f"{ollama_url}/api/tags")
                    res.raise_for_status()
                    names = [m["name"] for m in res.json().get("models", [])]
                short = {n.split(":")[0] for n in names}
                if embed_model in names or embed_model.split(":")[0] in short:
                    vectors: list[list[float]] = []
                    async with httpx.AsyncClient(timeout=60.0) as client:
                        for company in companies:
                            res = await client.post(
                                f"{ollama_url}/api/embeddings",
                                json={
                                    "model": embed_model,
                                    "prompt": _doc_text(company),
                                },
                            )
                            res.raise_for_status()
                            vectors.append(res.json()["embedding"])
                    return cls(
                        companies,
                        EmbeddingIndex(companies, vectors, ollama_url, embed_model),
                        "embedding",
                        embed_model,
                    )
            except Exception:
                pass  # Ollama 未启动或模型未安装，使用兜底方案
        return cls(companies, LexicalIndex(companies), "lexical", None)

    async def search(self, query: str, top_k: int) -> list[dict[str, Any]]:
        if self.mode == "embedding":
            assert isinstance(self.index, EmbeddingIndex)
            return await self.index.search(query, top_k)
        assert isinstance(self.index, LexicalIndex)
        return self.index.search(query, top_k)
