# If you come from bash you might have to change your $PATH.
# export PATH=$HOME/bin:$HOME/.local/bin:/usr/local/bin:$PATH

# Path to your Oh My Zsh installation.
export ZSH="$HOME/.oh-my-zsh"

# Set name of the theme to load --- if set to "random", it will
# load a random theme each time Oh My Zsh is loaded, in which case,
# to know which specific one was loaded, run: echo $RANDOM_THEME
# See https://github.com/ohmyzsh/ohmyzsh/wiki/Themes
ZSH_THEME="robbyrussell"

# Set list of themes to pick from when loading at random
# Setting this variable when ZSH_THEME=random will cause zsh to load
# a theme from this variable instead of looking in $ZSH/themes/
# If set to an empty array, this variable will have no effect.
# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# Uncomment the following line to use case-sensitive completion.
# CASE_SENSITIVE="true"

# Uncomment the following line to use hyphen-insensitive completion.
# Case-sensitive completion must be off. _ and - will be interchangeable.
# HYPHEN_INSENSITIVE="true"

# Uncomment one of the following lines to change the auto-update behavior
# zstyle ':omz:update' mode disabled  # disable automatic updates
# zstyle ':omz:update' mode auto      # update automatically without asking
# zstyle ':omz:update' mode reminder  # just remind me to update when it's time

# Uncomment the following line to change the frequency the auto-updater is run (in days).
# zstyle ':omz:update' frequency 13

# Uncomment the following line to set how old an update must be before it's applied, manually or via the auto-updater (in days).
# zstyle ':omz:update' cooldown 10

# Uncomment the following line if pasting URLs and other text is messed up.
# DISABLE_MAGIC_FUNCTIONS="true"

# Uncomment the following line to disable colors in ls.
# DISABLE_LS_COLORS="true"

# Uncomment the following line to disable auto-setting terminal title.
# DISABLE_AUTO_TITLE="true"

# Uncomment the following line to enable command auto-correction.
# ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
# You can also set it to another string to have that shown instead of the default red dots.
# e.g. COMPLETION_WAITING_DOTS="%F{yellow}waiting...%f"
# Caution: this setting can cause issues with multiline prompts in zsh < 5.7.1 (see #5765)
# COMPLETION_WAITING_DOTS="true"

# Uncomment the following line if you want to disable marking untracked files
# under VCS as dirty. This makes repository status check for large repositories
# much, much faster.
# DISABLE_UNTRACKED_FILES_DIRTY="true"

# Uncomment the following line if you want to change the command execution time
# stamp shown in the history command output.
# You can set one of the optional three formats:
# "mm/dd/yyyy"|"dd.mm.yyyy"|"yyyy-mm-dd"
# or set a custom format using the strftime function format specifications,
# see 'man strftime' for details.
# HIST_STAMPS="mm/dd/yyyy"

# Would you like to use another custom folder than $ZSH/custom?
# ZSH_CUSTOM=/path/to/new-custom-folder

# Which plugins would you like to load?
# Standard plugins can be found in $ZSH/plugins/
# Custom plugins may be added to $ZSH_CUSTOM/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
plugins=(git)

source $ZSH/oh-my-zsh.sh

# User configuration

# export MANPATH="/usr/local/man:$MANPATH"

# You may need to manually set your language environment
# export LANG=en_US.UTF-8

# Preferred editor for local and remote sessions
# if [[ -n $SSH_CONNECTION ]]; then
#   export EDITOR='vim'
# else
#   export EDITOR='nvim'
# fi

# Compilation flags
# export ARCHFLAGS="-arch $(uname -m)"

# Set personal aliases, overriding those provided by Oh My Zsh libs,
# plugins, and themes. Aliases can be placed here, though Oh My Zsh
# users are encouraged to define aliases within a top-level file in
# the $ZSH_CUSTOM folder, with .zsh extension. Examples:
# - $ZSH_CUSTOM/aliases.zsh
# - $ZSH_CUSTOM/macos.zsh
# For a full list of active aliases, run `alias`.
#
# Example aliases
# alias zshconfig="mate ~/.zshrc"
# alias ohmyzsh="mate ~/.oh-my-zsh"

eval "$(starship init zsh)"

# --- imports from old.rc ---

eval "$(zoxide init zsh)"

# Exports
export NVM_DIR="$HOME/.nvm"
export LS_COLORS='rs=0:no=00:mi=00:mh=00:ln=01;36:or=01;31:di=01;34:ow=04;01;34:st=34:tw=04;34:pi=01;33:so=01;33:do=01;33:bd=01;33:cd=01;33:su=01;35:sg=01;35:ca=01;35:ex=01;32:'
export NPM_TOKEN=$(
sed -n 's/.*:_authToken=\(.*\)/\1/p' ~/.npmrc | head -n1
)
export PATH="$HOME/n/bin:$PATH"

# Aliases
alias ll="ls -l"
alias ls="ls --color=auto"
alias notes="cd ~/projects/notes"
alias v="nvim"
alias vim="nvim"
alias scripts="cd ~/projects/scripts/"
alias projects="cd ~/projects/"
alias glog="git log --oneline"
alias c="code ."
alias cd="z"
alias week="date +%V"
alias execs="~/projects/scripts/exec_ecs.sh"
alias lotta='echo -e "\e[1;35mMartti \e[1;31m<3 \e[1;35mLotta \e[1;31m<3 \e[1;35mFrenja\e[0m"'
alias k='kubectl'
alias kn='k9s'
alias tf='terraform'

# NVM loader
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# FZF history widget
fzf-history-widget() {
LBUFFER=$(fc -rln 1 | fzf --height=50% --no-sort)
}
zle -N fzf-history-widget
bindkey '^R' fzf-history-widget

# Custom functions
rb() {
git rebase -i HEAD~"$1"
}

gb() {
git branch --show-current 2>/dev/null | sed 's/^/ (/;s/$/)/'
}

# History settings
SAVEHIST=100000

setopt SHARE_HISTORY # share history across all sessions in real time
setopt INC_APPEND_HISTORY # write to history file immediately after each command
setopt HIST_IGNORE_DUPS # don't record duplicate consecutive commands

# --- imports from .bashrc ---

# PATH additions
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    PATH="$HOME/.local/bin:$PATH"
fi
if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
    PATH="$HOME/bin:$PATH"
fi
export PATH="$PATH:/usr/local/go/bin"
export GOBIN="$HOME/.local/bin"

# Editor & terminal
export EDITOR='nvim'
export TERM='xterm-kitty'

# API tokens loaded from local secrets file
# Create ~/.local/share/dotfiles/secrets with:
#   GHP=<your-github-token>
#   OPENROUTER_API_KEY=<your-openrouter-key>
[ -f ~/.local/share/dotfiles/secrets ] && source ~/.local/share/dotfiles/secrets

# Talos
export TALOSCONFIG="$HOME/talos/talosconfig"
alias talos='talosctl'

# Extra aliases
alias vim='nvim'
alias vault='cd /home/mouru/Documents/obsidian'

# Rust/cargo
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"

# Kubectl completion (zsh equivalent)
source <(kubectl completion zsh)
