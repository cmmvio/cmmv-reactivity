import { effect, reactive } from "@vue/reactivity";
import { Context } from "./context";
import { nextTick } from "./scheduler";
import { toDisplayString } from "./directives/text";
import { nativeHtmlTags } from "./constants";
import { Block } from "./block";

const kebabToCamelCase = (str: string) =>
  str.replace(/-./g, (x) => x[1].toUpperCase());

function generateRandomId(length = 8): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) 
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    
    return result;
}

const subComponents = [];

export function mountComponent(
    ctx: Context, el: Element, 
    componentName: string, rootEl: Element,
    preProcess: boolean = false
): Promise<any> {
    return new Promise(async (resolve, reject) => {
        const Component = ctx.components[componentName];

        if (!Component) 
            return;
        
        let componentId = `${generateRandomId()}`;
        let componentScopeClass = `scope-${componentId}`;
        let props = {};
        let watchs = {};

        const extractProps = (el: Element, propsDefinition: any, scope: any) => {
            const props: Record<string, any> = {};
            const attrs = Array.from(el.attributes);

            attrs.forEach(attr => {
                const isDynamicProp = attr.name.startsWith(':');
                const propName = kebabToCamelCase(attr.name.replace(/^:/, ''));

                if (propsDefinition && propsDefinition[propName] !== undefined) {
                    if (isDynamicProp) {
                        props[propName] = parseAttrValue(attr.value, scope, `$root_${propName}`);                    
                        props[`$root_${propName}`] = attr.value;
                    } else {
                        props[propName] = parseAttrValue(attr.value);
                    }
                }
            });

            if(propsDefinition){
                Object.keys(propsDefinition).forEach(key => {
                    if (!(key in props)) {
                        props[key] = propsDefinition[key]?.default;
                        if (props[key] === undefined) props[key] = null;
                    }
                });
            }
            
            return props;
        };

        const parseAttrValue = (value: string, scope?: any, root?: string) => {
            if (scope) {
                try {
                    return scope[value]
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

        const preProcessFromString = (rootString) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(rootString, 'text/html');
            const elements = doc.querySelectorAll('*');
        
            elements.forEach(element => {
                Array.from(element.attributes).forEach(attr => {
                    if (attr.name.startsWith('c-') || attr.name.startsWith('v-')) {
                        const directiveName = attr.name;
                        const directiveValue = attr.value;

                        element.setAttribute(`data-${directiveName.replace("c-", "").replace("v-", "")}`, directiveValue);
                        element.removeAttribute(directiveName);
                    }
                });
            });
        
            return doc.body.innerHTML;
        }

        const posProcessFromString = (rootString) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(rootString, 'text/html');
            const elements = doc.querySelectorAll('*');
        
            elements.forEach(element => {
                Array.from(element.attributes).forEach(attr => {
                    
                    if (attr.name.startsWith('data-')) {                        
                        const directiveName = attr.name;
                        const directiveValue = attr.value;

                        element.setAttribute(`c-${directiveName.replace("data-", "")}`, directiveValue);
                        //element.removeAttribute(directiveName);
                    }
                });
            });
        
            return doc.body.innerHTML;
        }
        
        props = extractProps(el, Component.props, ctx.scope);
        const data = (typeof Component.data === "function") ? reactive(Component.data())  : {};
        const slots = { default: { html: el.innerHTML, scope: null }};

        el.querySelectorAll('template[v-slot], template[c-slot], template').forEach((slotEl: HTMLTemplateElement) => {
            const slotScope = slotEl.getAttribute('v-slot') || slotEl.getAttribute('c-slot');
            const slotName = slotEl.getAttribute('name') || "default";
            slots[slotName] = { html: slotEl.innerHTML, scope: slotScope };
        });

        let instance = {
            ...Component,
            $ref: componentId,
            $template: Component.template,
            $style: (Component.$style) ? Component.$style : {},
            $props: props,
            $watchs: watchs,
            $nextTick: nextTick,
            $s: toDisplayString,
            slots,        
            emit(event: string, payload: any) {          
                if (props[`$root_${event}`]) { 
                    ctx.scope.$refs[this.$ref] = this;    
                    const rootVar = props[`$root_${event}`];
                    ctx.scope[rootVar] = payload;
                }
                else if(this[`@${event}`]){
                    this[`@${event}`].call(this.$parent, payload);
                }
            }
        }

        Object.assign(instance, reactive(props), data, Component.methods);
        let componentInstance = reactive(instance);
        const ignoreProp = ["data", "mounted", "props", "styles", "created", "template"];

        ctx.components = (Component.components) ? { ...ctx.components, ...Component.components } : ctx.components;
        ctx.components = createComponentAliases(ctx.components);
        
        for(let key in Component){
            if(!ignoreProp.includes(key))
                instance[key] = Component[key];
        }
        
        const bindEventListeners = (element: Element, instance: any) => {
            Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('@'))
            .forEach(attr => {
                const eventName = attr.name.slice(1);
                const methodName = attr.value;
                if (typeof instance[methodName] === 'function') {
                    element.addEventListener(eventName, instance[methodName].bind(instance));
                    element.removeAttribute(attr.name);
                }
            });
        };

        const renderTemplate = async (
            template: string, data: any, 
            originalEl: Element, rootEl: Element
        ) => {
            let renderedTemplate = (preProcess) ? preProcessFromString(template) : posProcessFromString(template);      
            //const templateElement = document.createElement("div");      
            const tmpElement = document.createElement("div");
            tmpElement.innerHTML = renderedTemplate;
            const slots = tmpElement.querySelectorAll("slot");

            for (let slot of slots) {
                const slotName = slot.getAttribute("name") || "default";

                if (data.slots[slotName] && slotName !== "default") {
                    const templateSlot = document.createElement('div');
                    templateSlot.innerHTML = data.slots[slotName].html;  

                    renderedTemplate = renderedTemplate
                        .replace(slot.outerHTML.replace(/>.*?<\/slot>/gsi, " \/>").trim(), `<div name="${slotName}">${
                            data.slots[slotName].html.trim().replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
                                return data[key] !== undefined ? `<span c-text="${key}"></span>` : '';
                            })
                        }</div>`)
                        .replace(slot.outerHTML.replace(/>.*?<\/slot>/gsi, "\/>").trim(), `<div name="${slotName}">${
                            data.slots[slotName].html.trim().replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
                                return data[key] !== undefined ? `<span c-text="${key}"></span>` : '';
                            })
                        }</div>`);
                }
                else if(data.slots.default){
                    renderedTemplate = renderedTemplate
                        .replace(slot.outerHTML.replace(/>.*?<\/slot>/gsi, " \/>").trim(), data.slots.default.html)
                        .replace(slot.outerHTML.replace(/>.*?<\/slot>/gsi, "\/>").trim(), data.slots.default.html);
                }
                else{
                    renderedTemplate = renderedTemplate
                        .replace(slot.outerHTML.replace(/>.*?<\/slot>/gsi, " \/>").trim(), "")
                        .replace(slot.outerHTML.replace(/>.*?<\/slot>/gsi, "\/>").trim(), "");
                }
            }
            
            const parser = new DOMParser();
            const parsedDocument = parser.parseFromString(renderedTemplate, 'text/html');
            const bodyContent = parsedDocument.body.childNodes;
            let templateElement;

            if (bodyContent.length === 1) {
                templateElement = bodyContent[0];
            } else {
                templateElement = document.createElement('div');
                bodyContent.forEach(node => {
                    templateElement.appendChild(node);
                });
            }

            componentInstance["$el"] = templateElement;

            if(ctx.scope && ctx.scope.data && typeof ctx.scope.data === "function")
                componentInstance["$scope"] = reactive(ctx.scope.data());
            
            componentInstance["$root"] = rootEl;
            componentInstance["$parent"] = ctx.scope;

            const attrs = Array.from(originalEl.attributes);
            let currentRef = componentId;

            for (let attr of attrs) {
                if (attr.name === "ref") {
                    currentRef = attr.value;
                    componentInstance["$ref"] = attr.value;
                    templateElement.setAttribute('ref', attr.value);
                }
                else if(attr.name.startsWith("@")){
                    if(ctx.scope[attr.value])
                        componentInstance[attr.name] = ctx.scope[attr.value];       
                    else if(ctx.scope.methods[attr.value])     
                        componentInstance[attr.name] = ctx.scope.methods[attr.value];      
                    else
                        console.error(`${attr.value} dont exists in context`);            
                }
                else {
                    templateElement.setAttribute(attr.name, attr.value);
                }
            }

            if (!templateElement.hasAttribute("ref"))
                templateElement.setAttribute('ref', componentId);

            componentInstance.$template = templateElement.innerHTML;
            ctx.scope.$refs[`${currentRef}`] = componentInstance;

            if(preProcess)
                templateElement.setAttribute('scope', `$refs['${currentRef}']`);

            if (typeof Component.created === "function")
                Component.created.call(componentInstance);

            //if(!preProcess)
                bindEventListeners(templateElement, componentInstance);

            return templateElement;
        };

        if (Component.styles) {
            const styleId = `style-${componentName}`;

            if (!document.getElementById(styleId)) {
                const styleElement = document.createElement('style');
                styleElement.id = styleId;
                styleElement.innerHTML = Component.styles.replace(/\.\$scope/g, `.${componentScopeClass}`);
                document.head.appendChild(styleElement);
            }
        }

        if (typeof Component.mounted === "function")
            Component.mounted.call(componentInstance);

        effect(async () => {
            const component = await renderTemplate(Component.template, componentInstance, el, rootEl);
            let currentRef = componentId;  

            if(ctx.scope.$refs[`${currentRef}`]){
                ctx.scope.$refs[`${currentRef}`].$template = (preProcess) ? 
                    preProcessFromString(component.outerHTML) : posProcessFromString(component.outerHTML);
            }
            
            el.replaceWith(component);
            resolve(null);
        }); 
    })
};


function createComponentAliases(components) {
    const newComponents = { ...components };

    Object.keys(components).forEach((key) => {
        const kebabCaseName = camelToKebabCase(key);
        newComponents[kebabCaseName] = components[key];
        newComponents[key] = components[key];
        newComponents[key.toLowerCase()] = components[key];
    });

    return newComponents;
}

function camelToKebabCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}


