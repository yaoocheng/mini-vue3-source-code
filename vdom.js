// 创建vdom
const h = (tag, props, children) => {
    console.log('创建vdom');
    return {
        tag,
        props,
        children,
    }
}

// 通过mount函数挂在，更新webpage  
// 当前children是字符串表示元素内部是文本节点，是数组表示内部是元素节点
const mount = (vnode, container) => {
    // 创建真实dom
    const el = vnode.el = document.createElement(vnode.tag);
    // 设置属性
    if (vnode.props) {
        for (k in vnode.props) {
            if (k.startsWith('on')) {
                el.addEventListener(k.slice(2).toLowerCase(), vnode.props[k])
            } else {
                el.setAttribute(k, vnode.props[k]);
            }
        }
    }

    // 遍历子节点数组 并递归处理子节点vnode
    if (typeof vnode.children === 'string' || typeof vnode.children === 'number') {
        el.innerText = vnode.children;
    } else {
        vnode.children.forEach(child => {
            mount(child, el);
        });
    }

    // 最终挂在到app
    container.appendChild(el);
    console.log('挂载app，更新webpage');
}

// 传入配置 生成虚拟dom，render函数返回的就是h函数生成的虚拟dom
// const vdom = h('div', {
//     class: 'yc'
// }, [h('span', null, 'hello!'), h('span', null, 'wwe!')]);

// mount(vdom, document.getElementById('app'));


// 新虚拟dom
// const nvdom = h('div', {
//     class: 'yc'
// }, [h('p', {
//     id: 'new'
// }, 'changed!')]);

// diff对比
const patch = (v1, v2) => {
    console.log('新旧vdom对比');
    // tag相同情况
    if (v1.tag === v2.tag) {
        const el = v2.el = v1.el;

        // diff props
        const oldProps = v1.props || {};
        const newProps = v2.props || {};
        // 新旧props存在或新props存在属性旧props不存在  比较值变化
        for (const key in newProps) {
            const newVal = newProps[key];
            const oldVal = oldProps[key];
            if (newVal !== oldVal) {
                el.setAttribute(key, newVal);
            }
        }
        // 旧props存在属性，新props不存在
        for (const key in oldProps) {
            if (!(key in newProps)) {
                el.removeAttribute(key);
            }
        }

        // diff children
        const newChild = v2.children;
        const oldChild = v1.children;
        // new children是字符串
        if (typeof newChild === 'string' || typeof newChild === 'number') {
            if (typeof oldChild === 'string' || typeof newChild === 'number') {
                if (newChild !== oldChild) {
                    el.innerText = newChild;
                }
            } else {
                el.innerText = newChild;
            }
        } else {
            // new children是数组，old children是字符串
            if (typeof oldChild === 'string' || typeof newChild === 'number') {
                el.innerHTML = '';
                // 清空父节点并为父节点添加新子节点
                newChild.forEach(child => {
                    mount(child, el);
                })
            } else {
                // 两种个children都为数组简易比较
                const commonLength = Math.min(oldChild.length, newChild.length);
                // 公共长度对比children中每个子节点
                for (let i = 0; i < commonLength; i++) {
                    patch(oldChild[i], newChild[i]);
                }
                // 新增节点挂在到父节点上
                if (newChild.length > oldChild.length) {
                    newChild.slice(oldChild.length).forEach(child => {
                        mount(child, el);
                    });
                    // 删除节点从父节点移除
                } else if (newChild.length < oldChild.length) {
                    newChild.slice(oldChild.length).forEach(child => {
                        el.removeChild(child.el)
                    });
                }
            }
        }
    } else {
        // tag不相同  直接使用新vdom
        const oldEl = v1.el;
        const newEl = v2.el = document.createElement(v2.tag);
        const parentEl = oldEl.parentNode || document.getElementById('app');

        // 新节点设置属性
        if (v2.props) {
            for (k in v2.props) {
                newEl.setAttribute(k, v2.props[k]);
            }
        }

        // 处理新的children
        if (typeof v2.children === 'string') {
            newEl.innerText = v2.children;
        } else {
            v2.children.forEach(child => {
                mount(child, newEl);
            });
        }
        parentEl.insertBefore(newEl, oldEl);
        parentEl.removeChild(oldEl);
    }
}

// patch(vdom, nvdom);