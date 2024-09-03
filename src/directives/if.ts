import { Block } from '../block';
import { evaluate } from '../eval';
import { Context } from '../context';

interface Branch {
    exp?: string | null
    el: Element
}

export const _if = (el: Element, exp: string, ctx: Context) => {
    const parent = el.parentElement!;
    const anchor = new Comment('c-if');
    parent.insertBefore(anchor, el);

    const branches: Branch[] = [{ exp, el }];

    let elseEl: Element | null;
    let elseExp: string | null;

    while ((elseEl = el.nextElementSibling)) {
        elseExp = null;
        if (
            checkAttr(elseEl, 'v-else') === '' ||
            checkAttr(elseEl, 'c-else') === '' ||
            (elseExp = checkAttr(elseEl, 'v-else-if')) ||
            (elseExp = checkAttr(elseEl, 'c-else-if'))
        ) {
            parent.removeChild(elseEl);
            branches.push({ exp: elseExp, el: elseEl });
        } else {
            break;
        }
    }

    const nextNode = el.nextSibling;
    parent.removeChild(el);

    let block: Block | undefined;
    let activeBranchIndex = -1;

    const removeActiveBlock = () => {
        if (block) {
            block.remove();
            block = undefined;
        }
    };

    ctx.effect(() => {
        for (let i = 0; i < branches.length; i++) {
            const { exp, el } = branches[i];

            if (!exp || evaluate(ctx.scope, exp)) {
                if (i !== activeBranchIndex) {
                    removeActiveBlock();
                    block = new Block(el, ctx);
                    block.insert(parent, anchor);
                    activeBranchIndex = i;
                }
                return;
            }
        }
		
        activeBranchIndex = -1;
        removeActiveBlock();
    });

    return nextNode;
};

const checkAttr = (el: Element, name: string): string | null => {
    const val = el.getAttribute(name);
    if (val != null) el.removeAttribute(name);
    return val;
};
