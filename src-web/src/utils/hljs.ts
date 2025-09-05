import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript'
import java from 'highlight.js/lib/languages/java';
import css from 'highlight.js/lib/languages/css';
import less from 'highlight.js/lib/languages/less';
import go from 'highlight.js/lib/languages/go';
import php from 'highlight.js/lib/languages/php';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import stylus from 'highlight.js/lib/languages/stylus';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';

const languages = {
    javascript,
    java,
    css,
    less,
    go,
    php,
    python,
    ruby,
    stylus,
    typescript,
    xml
};

Object.keys(languages).forEach(key => {
    hljs.registerLanguage(key, languages[key]);
});

export default hljs;