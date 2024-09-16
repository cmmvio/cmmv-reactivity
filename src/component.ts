import { effect, reactive } from "@vue/reactivity";
import { Context } from "./context";

const kebabToCamelCase = (str: string) =>
  str.replace(/-./g, (x) => x[1].toUpperCase());

function generateRandomId(length = 8): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) 
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    
    return result;
}

export function mountComponent(ctx: Context, el: Element, componentName: string, rootEl: Element) {
    const camelCaseName = kebabToCamelCase(componentName);
    const Component = ctx.components[camelCaseName];

    if (!Component) 
        return;
    
    let componentId = `${generateRandomId()}`;
    let componentScopeClass = `scope-${componentId}`;

    const extractProps = (el: Element, propsDefinition: any, scope: any) => {
        const props: Record<string, any> = {};
        const attrs = Array.from(el.attributes);

        attrs.forEach(attr => {
            const isDynamicProp = attr.name.startsWith(':');
            const propName = kebabToCamelCase(attr.name.replace(/^:/, ''));

            if (propsDefinition && propsDefinition[propName] !== undefined) {
                if (isDynamicProp) {
                    props[propName] = parseAttrValue(attr.value, scope);
                    props[`$root_${propName}`] = attr.value;
                } else {
                    props[propName] = parseAttrValue(attr.value);
                }
            }
        });

        if(propsDefinition){
            Object.keys(propsDefinition).forEach(key => {
                if (!(key in props)) {
                    props[key] = propsDefinition[key]?.defaultValue;
                    if (props[key] === undefined) props[key] = null;
                }
            });
        }
        
        return props;
    };

    const parseAttrValue = (value: string, scope?: any) => {
        if (scope) {
            try {
                return new Function("scope", `with(scope){ return ${value}; }`)(scope);
            } catch (e) {
                return value;
            }
        } else {
            if (value === 'true') return true;
            if (value === 'false') return false;
            if (!isNaN(Number(value))) return Number(value);
            return value;
        }
    };

    const props = extractProps(el, Component.props, ctx.scope);
    const data = (typeof Component.data === "function") ? Component.data() : {};

    const slots = {};

    el.querySelectorAll('template[v-slot], template[c-slot]').forEach((slotEl: HTMLTemplateElement) => {
        const slotScope = slotEl.getAttribute('v-slot') || slotEl.getAttribute('c-slot');
        const slotName = slotEl.getAttribute('name') || "default";
        slots[slotName] = { html: slotEl.innerHTML, scope: slotScope };
    });

    let componentInstance = reactive({
        $ref: componentId,
        $template: Component.template,
        $style: (Component.$style) ? Component.$style : {},
        slots,
        emit(event: string, payload: any) {
            if (props[`$root_${event}`]) { 
                ctx.scope.$refs[this.$ref] = this;    
                const rootVar = props[`$root_${event}`];
                ctx.scope[rootVar] = payload;
            }
        },
        ...props,
        ...data,
        ...Component.methods
    });

    const bindEventListeners = (element: Element, instance: any) => {
        const events = Array.from(element.attributes).filter(attr => attr.name.startsWith('@'));
        events.forEach(attr => {
            const eventName = attr.name.slice(1); 
            const methodName = attr.value;
            if (typeof instance[methodName] === 'function') {
                element.addEventListener(eventName, instance[methodName].bind(instance));
            }
        });
    };

    const renderTemplate = (template: string, data: any, originalEl: Element, rootEl: Element) => {
        let renderedTemplate = template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
            return data[key] !== undefined ? data[key] : '';
        });

        const templateElement = document.createElement('div');
        templateElement.innerHTML = renderedTemplate;
        const slots = templateElement.querySelectorAll(`slot`);

        for (let slot of slots) {
            const slotName = slot.getAttribute("name") || "default";

            if (data.slots[slotName]) {
                const templateSlot = document.createElement('div');
                templateSlot.innerHTML = data.slots[slotName].html;  
                
                renderedTemplate = renderedTemplate
                    .replace(slot.outerHTML.replace("></slot>", " \/>").trim(), data.slots[slotName].html);
            }
            else{
                renderedTemplate = renderedTemplate
                    .replace(slot.outerHTML.replace("></slot>", " \/>").trim(), "<!-- Template not defined -->");
            }
        }

        templateElement.innerHTML = renderedTemplate;

        componentInstance["$el"] = templateElement;

        if(ctx.scope && ctx.scope.data && typeof ctx.scope.data === "function")
            componentInstance["$scope"] = ctx.scope.data();
        
        componentInstance["$root"] = rootEl;

        const attrs = Array.from(originalEl.attributes);
        let currentRef = componentId;

        for (let attr of attrs) {
            if (attr.name === "ref") {
                currentRef = attr.value;
                componentInstance["$ref"] = attr.value;
                templateElement.setAttribute('ref', attr.value);
            } else {
                templateElement.setAttribute(attr.name, attr.value);
            }
        }

        if (!templateElement.hasAttribute("ref"))
            templateElement.setAttribute('ref', componentId);

        templateElement.setAttribute('scope', `$refs['${currentRef}']`);

        const refContext = reactive(componentInstance);
        ctx.scope[currentRef] = refContext;
        ctx.scope.$refs[currentRef] = refContext;

        if (typeof Component.created === "function")
            Component.created.call(componentInstance);

        bindEventListeners(templateElement, componentInstance);

        return templateElement;
    };

    if (Component.styles) {
        const styleId = `style-${camelCaseName}`;

        if (!document.getElementById(styleId)) {
            const styleElement = document.createElement('style');
            styleElement.id = styleId;
            styleElement.innerHTML = Component.styles.replace(/\.\$scope/g, `.${componentScopeClass}`);
            document.head.appendChild(styleElement);
        }
    }

    if (typeof Component.mounted === "function")
        Component.mounted.call(componentInstance);

    effect(() => {
        el.replaceWith(renderTemplate(Component.template, componentInstance, el, rootEl));
    });
};
