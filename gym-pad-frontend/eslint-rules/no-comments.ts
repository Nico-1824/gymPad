import type { AST, Rule } from 'eslint'

const TOOL_DIRECTIVE =
  /^\s*(eslint|global\s|globals\s|exported\s|@ts-|istanbul\s|c8\s|v8\s|prettier-ignore|oxlint|#region|#endregion|\/\s*<reference)/

type CommentLike = { value: string; loc?: AST.SourceLocation | null }

type VueProgram = { templateBody?: { comments?: CommentLike[] } }

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Discourage comments: prefer self-explanatory code (named constants, descriptive function and variable names).',
    },
    messages: {
      avoidComment:
        'Avoid comments. Make the code explain itself instead: extract a named constant, or give the function/variable a descriptive name.',
    },
    schema: [],
  },

  create(context) {
    const reportUnlessDirective = (comment: CommentLike) => {
      if (TOOL_DIRECTIVE.test(comment.value) || !comment.loc) return
      context.report({ loc: comment.loc, messageId: 'avoidComment' })
    }

    return {
      Program(program) {
        context.sourceCode.getAllComments().forEach(reportUnlessDirective)
        ;(program as unknown as VueProgram).templateBody?.comments?.forEach(reportUnlessDirective)
      },
    }
  },
}

export default rule
