return {
  {
    'iamcco/markdown-preview.nvim',
    cmd = { 'MarkdownPreviewToggle', 'MarkdownPreview', 'MarkdownPreviewStop' },
    build = 'cd app && npm install',
    init = function()
      vim.g.mkdp_filetypes = { 'markdown' }
      -- opens preview in default browser when entering a markdown buffer
      -- vim.g.mkdp_auto_start = 1
      -- refreshes on save or leave insert mode
      vim.g.mkdp_refresh_slow = 0
      -- echo preview page url in command line when opening preview
      vim.g.mkdp_echo_preview_url = 1
      -- disable syncing cursor position between nvim and preview
      vim.g.mkdp_preview_options = { sync_scroll_type = 'middle' }
    end,
    ft = { 'markdown' },
    keys = {
      { '<leader>p', '<cmd>MarkdownPreviewToggle<CR>', desc = '[P]review Markdown' },
      { '<leader>ms', '<cmd>MarkdownPreview<CR>', desc = '[M]arkdown preview [S]tart' },
      { '<leader>mx', '<cmd>MarkdownPreviewStop<CR>', desc = '[M]arkdown preview stop ([X])' },
    },
  },
}
