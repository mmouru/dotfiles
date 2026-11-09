-- pi2.nvim: Neovim integration for the pi coding agent.
-- https://github.com/zgs225/pi2.nvim
return {
  {
    'zgs225/pi2.nvim',
    dependencies = {
      -- Required by the default history renderer (render.engine = "render-markdown").
      'MeanderingProgrammer/render-markdown.nvim',
      -- Optional: only needed for :PiPasteImage clipboard-image paste.
      -- 'HakonHarnes/img-clip.nvim',
    },
    config = function()
      require('pi').setup()
    end,
  },
}
