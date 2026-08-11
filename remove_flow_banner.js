const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'modules', 'ModuleViews.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove FlowBanner interface and component definition
content = content.replace(/interface FlowBannerProps \{[\s\S]*?const FlowBanner: React\.FC<FlowBannerProps> = \([\s\S]*?\}\);\s*\};\s*/, '');

// Remove FlowBanner imports or usages
content = content.replace(/<FlowBanner[\s\S]*?\/>\s*/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('FlowBanner removed successfully.');
