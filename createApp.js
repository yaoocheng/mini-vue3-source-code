const createApp = (App) => {
    let ismounted = false;
    let preVdom = null;
    const getVdom = () => {
        let vdom = null;
        // 优先使用render返回的vdom  > template > innerHTML
        if (App.render) {
            vdom = App.render();
        } else if (App.template) {
            vdom = compile(App.template)()
        } else {
            vdom = compile(document.getElementById('app').innerHTML)()
        }
        return vdom
    }

    watchEffect(() => {
        // 未挂载：首次渲染  已挂载新旧dom对比 渲染
        if (ismounted) {
            let newVdom = null;
            newVdom = getVdom();
            patch(preVdom, newVdom);
            preVdom = newVdom;
        } else {
            preVdom = getVdom();
            mount(preVdom, document.getElementById('app'));
            ismounted = true;
        }
    })
}