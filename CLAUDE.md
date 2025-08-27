# CashFlowIQ Project Instructions

## Development Guidelines

### Git Workflow
- **ALWAYS COMMIT CHANGES**: After completing any task, feature, or bug fix, immediately commit the changes with a descriptive commit message
- Use conventional commit format: `feat:`, `fix:`, `refactor:`, etc.
- Include the Claude Code attribution footer in all commit messages:
  ```
  🤖 Generated with [Claude Code](https://claude.ai/code)
  
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

### Code Standards
- Follow existing code patterns and conventions in the codebase
- Use TypeScript for type safety
- Implement proper error handling and loading states
- Add comprehensive logging for debugging
- Follow the established UI/UX patterns with shadcn/ui components

### Architecture Notes
- Using Supabase for database with direct client-side integration
- React Query (TanStack Query) for server state management
- Direct API calls bypass serverless functions for better performance
- Row Level Security (RLS) policies ensure data isolation

### Testing
- Run lint and type checks before committing if available
- Test functionality manually in the browser
- Ensure responsive design works on different screen sizes

### Important Reminders
- Always prefer editing existing files over creating new ones
- Never create documentation files unless explicitly requested
- Keep responses concise and focused on the specific task
- Always commit changes after completing work