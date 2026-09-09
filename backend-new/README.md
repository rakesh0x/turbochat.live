                    ┌──────────────┐
                    │    Query     │
                    └──────┬───────┘
                           │
                    Query understanding
                           │
              ┌────────────┴────────────┐
              │                         │
        Dense retrieval            Sparse retrieval
        (embeddings)                (BM25/etc.)
              │                         │
              └────────────┬────────────┘
                           │
                     Candidate merge
                           │
                     Deduplication
                           │
                  Lightweight ranking
                           │
                    Top 50–200
                           │
                     Heavy reranker
                           │
                       Top 10–20
                           │
                 ┌─────────┴─────────┐
                 │                   │
              diversity          business/
              control             freshness
                 │                   │
                 └─────────┬─────────┘
                           │
                     Final ranking
                           │
                       Top K

