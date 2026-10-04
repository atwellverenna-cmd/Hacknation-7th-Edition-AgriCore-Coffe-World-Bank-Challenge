<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Leaf diagnosis: Lovable AI (server fn) may only pick an answer-bank label; on-device deterministic fallback when offline/unavailable. Why: advice must never be AI-generated.
- Officer PDF export is generated client-side (jspdf) so it works offline.
- Co-op access checks the active flag so retired test codes remain stored without admitting new joins or syncs.
