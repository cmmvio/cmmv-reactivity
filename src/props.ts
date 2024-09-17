import { Context } from "./context";

export const updateProps = (ctx: Context, prop, value) => {
    for(let keyRef in ctx.scope.$refs){
        if(ctx.scope.$refs[keyRef] && ctx.scope.$refs[keyRef].$props){
            for(let propName in ctx.scope.$refs[keyRef].$props){
                if(
                    propName.startsWith("$root") &&
                    ctx.scope.$refs[keyRef].$props[propName] === prop
                ){
                    ctx.scope.$refs[keyRef][propName.replace("$root_", "")] = value;
                    Reflect.set(ctx.scope.$refs[keyRef], propName.replace("$root_", ""), value);
                }
            }
        }
    }
}