class Node {
    constructor({
        tag
    }) {
        // tag的名称
        this.tag = tag;
        // 属性
        this.attribute = {};
        // 节点对应的文本，这里值针对叶子节点
        this.text = '';
        // 节点的子节点
        this.children = [];
    }
}
const INIT = 'init'; // 初始状态
const TAG_START = 'tagStart'; // 解析开始标签
const ATTRIBUTE_START = 'attributeStart'; // 开始解析属性
const ATTRIBUTE_VALUE = 'attributeValue'; // 解析属性值
const ATTRIBUTE_END = 'attributeEnd'; // 解析一个属性结束
const TAG_END = 'tagEnd'; // 解析开始标签结束
const OPEN_TAG = 'openTag'; // 打开了一个标签
const CLOSE_TAG = 'closeTag'; // 解析完成一个标签，关闭
const CLOSE_TAG_START = 'closeTagStart'; // 开始解析结束标签
const CLOSE_TAG_END = 'closeTagEnd'; // 解析结束标签结束

const regMap = {
    isLetter: /[a-zA-Z]/,
    isEmpty: /[\s\n]/,
};

const $reg = {};
Object.keys(regMap).forEach(key => {
    const reg = regMap[key];
    $reg[key] = (s) => reg.test(s);
});

/**
 * 解析Vue的template模版
 */
class ParseHtml {
    constructor(html) {
        this.html = html;
        // 状态
        this.status = 'init';
        // 索引
        this.index = 0;
        // 栈
        this.tagStack = [];
        // 文本
        this.text = '';
        // 当前标签名
        this.tagName = '';
        // 正则
        this.$reg = $reg;
        // 输出的根节点
        this.node = null;
        // 当前节点
        this.currentNode = null;
        // 属性名
        this.attributeName = '';
        // 属性值
        this.attributeValue = '';
    }
    // 预处理
    preHandle() {
        this.html = this.html.replace(/\n[ ]+/g, '');
        this.html = this.html.replace(/\n/g, '');
        this.html = this.html.replace(/[ ]+/g, ' ');
        this.html = this.html.replace(/<[\s]+/g, '<');
        this.html = this.html.replace(/[\s]+>/g, '>');
        this.html = this.html.replace(/[\s]+\/>/g, '/>');
        this.html = this.html.replace(/[\s]*=[\s]*"/g, '="');
    }
    // 解析主流程
    parse() {
        this.preHandle();
        for (this.index = 0; this.index < this.html.length; this.index++) {
            const s = this.html[this.index];
            const pre = this.html[this.index - 1];
            const next = this.html[this.index + 1];
            // console.log(s, next, this.status);
            switch (this.status) {
                case INIT:
                    this.parseInit(s, pre, next);
                    break;
                case TAG_START:
                    this.parseTagStart(s, pre, next);
                    break;
                case ATTRIBUTE_START:
                    this.parseAttributeStart(s, pre, next);
                    break;
                case ATTRIBUTE_VALUE:
                    this.parseAttributeValue(s, pre, next);
                    break;
                case ATTRIBUTE_END:
                    this.parseAttributeEnd(s, pre, next);
                    break;
                case TAG_END:
                    this.parseTagEnd(s, pre, next);
                    break;
                case OPEN_TAG:
                    this.parseOpenTag(s, pre, next);
                    break;
                case CLOSE_TAG_START:
                    this.parseCloseTagStart(s, pre, next);
                    break;
                case CLOSE_TAG_END:
                    this.parseCloseTagEnd(s, pre, next);
                    break;
                default:
                    break;
            }
        }
        return this.node;
    }
    // 解析初始状态
    parseInit(s) {
        if (s === '<') {
            this.status = TAG_START;
        }
    }
    // 解析开始标签
    parseTagStart(s, pre, next) {
        const handle = (isSelfCloseTag) => {
            if (!this.node) {
                this.node = new Node({
                    tag: this.tagName
                });
                this.currentNode = this.node;
                this.parentNode = null;
            } else {
                this.parentNode = this.currentNode;
                this.currentNode = new Node({
                    tag: this.tagName
                });
                this.parentNode.children.push(this.currentNode);
            }
            this.tagStack.push(this.currentNode);
        }
        if (this.$reg.isLetter(s)) {
            // 标签名
            this.tagName += s;
        } else if (this.$reg.isEmpty(s) && this.$reg.isLetter(next)) {
            // 解析属性
            handle();
            this.status = ATTRIBUTE_START;
        }
        if (next === '>') {
            // 开始标签结尾
            handle();
            this.status = TAG_END;
        }

    }
    // 开始解析属性
    parseAttributeStart(s, pre, next) {
        // if (this.$reg.isLetter(s)) {
        if (s !== '=') {
            this.attributeName += s;
        }
        if (next === ' ' || next === '>' || (next === '/' && this.html[this.index + 2] === '>')) {
            this.currentNode.attribute[this.attributeName] = this.attributeValue;
            this.attributeName = '';
            this.attributeValue = '';
        }
        if (next === ' ') {
            this.status = ATTRIBUTE_END;
        } else if (next === '>' || next === '' || (next === '/' && this.html[this.index + 2] === '>')) {
            this.status = TAG_END;
        } else if (next === '"') {
            this.status = ATTRIBUTE_VALUE;
        }
    }
    // 解析属性值开始
    parseAttributeValue(s, pre, next) {
        if (s !== '"') {
            this.attributeValue += s;
        }
        if (next === '"') {
            this.currentNode.attribute[this.attributeName] = this.attributeValue;
            this.attributeName = '';
            this.attributeValue = '';
            this.status = ATTRIBUTE_END;
        }
    }
    // 解析属性结束
    parseAttributeEnd(s, pre, next) {
        if (this.$reg.isEmpty(s)) {
            this.status = ATTRIBUTE_START;
        }
        if (next === '>') {
            this.status = TAG_END;
        }
    }
    // 解析开始标签结束
    parseTagEnd(s, pre, next) {
        if (pre === '/' && s === '>') {
            // 自闭合标签
            this.status = CLOSE_TAG_END;
            this.index--; // 回退一步，使关闭标签的索引落在>上以便正常解析
            return;
        }
        if (s === '>') {
            this.tagName = '';
            this.status = OPEN_TAG;
        }
    }
    // 打开了一个标签
    parseOpenTag(s, pre, next) {
        if (s === '<') {
            if (next === '/') {
                this.status = CLOSE_TAG_START;
            } else {
                this.status = TAG_START;
            }
        } else {
            this.currentNode.text += s;
        }
    }
    // 解析完成一个标签，关闭
    parseCloseTagStart(s, pre, next) {
        if (this.$reg.isLetter(s)) {
            // if (s !== '>' && s !== '/') {
            this.tagName += s;
        } else if (this.$reg.isEmpty(s)) {
            throw new Error('解析闭合标签失败: ' + this.tagName);
        }

        if (next === '>') {
            this.status = CLOSE_TAG_END;
        }
    }
    // 解析结束标签结束
    parseCloseTagEnd(s, pre, next) {
        if (s === '>') {
            const stackTop = this.getTagStackTop();
            if (stackTop.tag === this.tagName) {
                // this.currentNode = stackTop;
                deleteEmptyProp(stackTop);
                this.tagStack.pop();
                this.currentNode = this.getTagStackTop();
                this.tagName = '';
                this.status = OPEN_TAG;
            } else {
                throw new Error('标签不能闭合: ' + this.tagName);
            }
        }
        // 删除空属性
        function deleteEmptyProp(node) {
            if (!node.text) {
                delete node.text;
            }
            if (node.children.length === 0) {
                delete node.children;
            }
            if (Object.keys(node.attribute).length === 0) {
                delete node.attribute;
            }
        }
    }
    // 获取栈顶
    getTagStackTop() {
        return this.tagStack[this.tagStack.length - 1];
    }
}

function transform(ast) {
    if(ast.text) {
        ast.children = ast.text;
        delete ast.text;
    }
    if(ast.attribute) {
        ast.props = ast.attribute;
        delete ast.attribute;
    }

    if(ast.children && ast.children instanceof Array) {
        ast.children.forEach(item => {
            transform(item);
        })
    }
}

function compiler(html) {
    return function render() {
        const parseHtml = new ParseHtml(html);
        const result = parseHtml.parse();
        transform(result)
        return result;
    }
}

const html = `<div id="o">
<p>123</p>
</div>`





