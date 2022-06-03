// 记录依赖函数
let activeEffect = null;

// 定义数据的dep依赖对象
class Dep {
    constructor() {
        // 存储依赖响应数据的订阅函数
        this.subscribers = new Set();
    }

    // 读取时触发 添加订阅函数 
    depend() {
        // console.log('get(读取数据时触发dep.depend): 订阅集合添加依赖此数据的watch函数');
        if (activeEffect) {
            this.subscribers.add(activeEffect);
        }
    }

    // 更新时触发 触发订阅函数执行
    notify() {
        // console.log('set(数据变化时触发dep.notify): 执行订阅集合中所有依赖此数据的watch函数');
        this.subscribers.forEach(effect => {
            effect();
        })
    }
}

// 处理所有依赖响应数据的依赖函数，会在首次get data时加入对应响应数据的依赖集合中
function effection(eft) {
    activeEffect = eft;
    eft();
    activeEffect = null;
}

// vue3中watchEffect会依赖响应数据进行执行，所以会被添加到响应数据的依赖集合中
// 相当于render watcher被记录在dep中，数据变化执行这个watcher函数
const watchEffect = (effect) => {
    // 首次运行让当前响应数据的dep记录这个依赖函数加入到订阅集合中
    effection(effect)
}


// computed
const computed = (getter) => {
    const result = ref(null);  // 定义响应式数据对象
    effection(() => result.value = getter());  // 当依赖数据变化触发匿名函数运行
    return result  // ⭐ 将整个响应对象返回给接受的变量，此时变量指向响应对象，并跟随响应对象的值变化而变化
}

// 将原对象处理为响应式
let targetMap = new WeakMap(); // 以对象做为键值 不被其他变量引用
const getDep = (target, key) => {
    // 为整个对象设置属性的deps集合  [obj, deps]
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    // 获取每个属性的dep  [key, dep]
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Dep();
        depsMap.set(key, dep);
    }
    return dep;
}

const reactive = (raw) => {
    console.log('响应式处理，每个属性添加dep对象');
    //ES5 响应式写法
    // Object.keys(raw).forEach(key => {
    //     // 为每个属性创建一个dep
    //     const dep = new Dep();
    //     let value = raw[key];

    //     Object.defineProperty(raw, key, {
    //         //读取时触发 添加订阅函数
    //         get() {
    //             dep.depend()
    //             return value;
    //         },
    //         //更新时触发 触发订阅函数执行
    //         set(newValue) {
    //             value = newValue;
    //             dep.notify();
    //         }
    //     })
    // })
    // return raw;

    //ES6响应式写法
    return new Proxy(raw, {
        get(target, key) {
            // 获取每个属性的dep
            const dep = getDep(target, key);
            dep.depend();
            return Reflect.get(target, key);
        },
        set(target, key, value) {
            const dep = getDep(target, key);
            const result = Reflect.set(target, key, value);
            dep.notify();
            return result; // 返回一个布尔值指示此操作是否成功
        }
    })
}

const ref = (raw) => {
    const rawObj = {
        value: raw,
    }
    return reactive(rawObj)
}

// 定义一个响应式对象
// const state = reactive({
//     count: 0,
// })

// watchEffect首先先运行一次，之后依赖有变化就会运行
// watchEffect(() => {
//     console.log('watchEffect触发');
//     console.log(state.count);
// })

// const clickHandle = () => {
//     state.count++;
// }