-- Improves viewing Markdown files in Neovim.
-- https://github.com/MeanderingProgrammer/render-markdown.nvim
return {
  {
    'MeanderingProgrammer/render-markdown.nvim',
    dependencies = {
      'nvim-treesitter/nvim-treesitter',
      'nvim-mini/mini.icons', -- already used by oil for icons
    },
    ft = { 'markdown' },
    opts = {},
  },
}
