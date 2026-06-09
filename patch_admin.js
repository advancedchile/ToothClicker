const fs = require('fs');
let code = fs.readFileSync('admin.jsx', 'utf8');

// Replace the normal message preview
code = code.replace(/setPreviewMsg\(\{[\s\S]*?msgType:\s*'normal',[\s\S]*?\.\.\.editingCustomMessage[\s\S]*?\}\)/, `setPreviewMsg({
                        isCustom: true,
                        msgType: 'normal',
                        ...editingCustomMessage,
                        ledColor: editingCustomMessage.extraData?.ledColor || editingCustomMessage.ledColor,
                        ledBgColor: editingCustomMessage.extraData?.ledBgColor || editingCustomMessage.ledBgColor,
                        ledSpeed: editingCustomMessage.extraData?.ledSpeed || editingCustomMessage.ledSpeed,
                        ledBrightness: editingCustomMessage.extraData?.ledBrightness || editingCustomMessage.ledBrightness,
                        ledDirection: editingCustomMessage.extraData?.ledDirection || editingCustomMessage.ledDirection,
                        ledTextSize: editingCustomMessage.extraData?.ledTextSize || editingCustomMessage.ledTextSize
                      })`);

fs.writeFileSync('admin.jsx', code);
