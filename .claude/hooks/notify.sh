#!/bin/bash
# Stop: Windows toast notification + session log

LOG_FILE="C:/Users/user/sally-ai/.claude/session.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] Claude session ended" >> "$LOG_FILE" 2>/dev/null

powershell.exe -NoProfile -NonInteractive -Command "
  Add-Type -AssemblyName System.Windows.Forms;
  \$n = New-Object System.Windows.Forms.NotifyIcon;
  \$n.Icon = [System.Drawing.SystemIcons]::Information;
  \$n.Visible = \$true;
  \$n.ShowBalloonTip(3000, 'Nitor8', 'Claude 작업 완료', [System.Windows.Forms.ToolTipIcon]::Info);
  Start-Sleep -Milliseconds 3500;
  \$n.Dispose()
" 2>/dev/null || true

exit 0
