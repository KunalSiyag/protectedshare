# Role: Utility Agent (Module 3)

## TASK OVERVIEW
Your task is to build the "AI to X/Twitter Formatter" pure logic package and its UI integration.

## CONTEXT
Please refer to `GLOBAL_CONTEXT.md`. You operate within `packages/formatting` and a specific Next.js page in `apps/web`.

## OWNERSHIP (APPS/WEB)
- You own only `apps/web/app/x-formatter/**` in the frontend app.
- Do not edit note/secret routes or shared layout/theme setup outside x-formatter unless explicitly reassigned.

## RESPONSIBILITIES
1. **Formatting Logic (`packages/formatting`)**:
   - Write pure TypeScript functions to clean up AI-generated text.
   - Convert standard markdown bold `**text**` to Unicode bold (`𝘁𝗲𝘅𝘁` or similar mathematical sans-serif bold).
   - Clean up excessive bullet points or spaces.
   - Character counting utility optimized for Twitter limits.
2. **UI Integration (`apps/web/app/x-formatter/page.tsx`)**:
   - Build a dual-pane or simple text-area interface.
   - User pastes AI output, it instantly formats on the right/bottom.
   - "Copy to Clipboard" button.

## RULES
- This module requires NO backend APIs. It is 100% client-side.
- Ensure the Unicode conversion handles edge cases gracefully.
