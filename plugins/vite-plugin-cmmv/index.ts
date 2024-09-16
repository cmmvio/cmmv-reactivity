import { Plugin } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

export function cmmvPlugin(): Plugin {
    return {
        name: 'vite-plugin-cmmv',
        transform(src, id) {
            if (id.endsWith('.cmmv')) {
                const templateMatch = src.match(/<template>([\s\S]*?)<\/template>/);
                const scriptMatch = src.match(/<script.*?>([\s\S]*?)<\/script>/);
                const styleMatch = src.match(/<style.*?>([\s\S]*?)<\/style>/);

                const template = templateMatch ? templateMatch[1].trim() : '';
                const style = styleMatch ? styleMatch[1].trim() : '';                
                let scriptContent = scriptMatch ? scriptMatch[1].trim() : '';

                if (scriptContent.includes('export default')) {
                    scriptContent = scriptContent.replace(
                        /export default\s*{([\s\S]*?)}/,
                        `export default { template: \`${template}\`, styles: \`${style}\`, $1 }`
                    );
                }

                return {
                    code: scriptContent,
                    map: null 
                };
            }
        },
        load(id) {
            if (id.endsWith('.cmmv')) {
                return fs.readFileSync(path.resolve(id), 'utf-8');
            }
        }
    };
}
