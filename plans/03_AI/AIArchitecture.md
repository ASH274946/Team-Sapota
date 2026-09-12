# AI architecture
Use a constrained orchestration service: parse documents → extract structured academic entities → faculty approve graph mappings → retrieve approved evidence → plan deterministic constraints → generate one structured artefact/item → run deterministic and model-based checks → present for review. Every model response must carry source IDs, model/prompt version and confidence signals. The model writes and classifies; policy, planning, validation and approval remain system-owned.

## VID-6: Socratic AI Tutor WebSocket Streaming & RAG Grounding Architecture

```text
Student Question
       │
       ▼
Socket.IO Connection (`tutor:stream_query`)
       │
       ▼
Session Access Verification & Authorization (`prisma.tutorSession`)
       │
       ▼
Grounded RAG Context Retrieval (`retrieveContextWithSources()`)
       │
       ├───► Emit Immediate Sources Event (`tutor:sources`) ──► Frontend Citation Cards Render
       │
       ▼
Grounded Socratic Prompt Construction (`readMasterPrompt()`)
       │
       ▼
NVIDIA NIM / Groq / OpenAI Provider Failover Streaming (`AIOrchestrator.stream()`)
       │
       ├───► Emit Token Chunks (`tutor:chunk`) ──► Zustand Appends Tokens to Single Assistant Msg
       │
       ▼
Stream Completion & Database Persistence (`prisma.tutorMessage`)
       │
       └───► Emit Completion Event (`tutor:done`) ──► UI State Finalization
```

### Protocol & Event Contract

1. `tutor:stream_query`: Payload `{ sessionId, message, mode?, requestId }`
2. `tutor:sources`: Emitted immediately upon RAG completion with array of `RagSourceCitation` objects (`chunkId`, `documentId`, `filename`, `excerpt`, `score`).
3. `tutor:chunk`: Incremental token payload `{ requestId, token, index }`.
4. `tutor:done`: Emitted on stream completion `{ requestId, messageId, message, followUp, confidence, ragReferences }`.
5. `tutor:error`: Emitted on error `{ requestId, error }`.

### Fallback & Resilience Policies
- **HTTP Fallback**: If WebSocket connection or handshake fails, `useTutorSocket` seamlessly falls back to `POST /api/v1/tutor/sessions/:id/messages`.
- **Stream Isolation**: Socket responses use `socket.emit()` or `sessionRoom()` isolation. Private responses are never broadcast globally (`io.emit`).
- **Abort on Disconnect**: Socket disconnect triggers `AbortController.abort()` to terminate active LLM streaming and free provider resources.

