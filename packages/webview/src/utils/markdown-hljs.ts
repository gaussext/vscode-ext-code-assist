import '@/lib/atom-one-dark.min.css';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
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
import rust from 'highlight.js/lib/languages/rust';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import scala from 'highlight.js/lib/languages/scala';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import scss from 'highlight.js/lib/languages/scss';
import dart from 'highlight.js/lib/languages/dart';
import lua from 'highlight.js/lib/languages/lua';
import perl from 'highlight.js/lib/languages/perl';
import objectivec from 'highlight.js/lib/languages/objectivec';
import r from 'highlight.js/lib/languages/r';
import matlab from 'highlight.js/lib/languages/matlab';
import julia from 'highlight.js/lib/languages/julia';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import powershell from 'highlight.js/lib/languages/powershell';
import nginx from 'highlight.js/lib/languages/nginx';
import haskell from 'highlight.js/lib/languages/haskell';
import elixir from 'highlight.js/lib/languages/elixir';
import erlang from 'highlight.js/lib/languages/erlang';
import clojure from 'highlight.js/lib/languages/clojure';

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
  xml,
  rust,
  cpp,
  csharp,
  swift,
  kotlin,
  scala,
  sql,
  bash,
  json,
  yaml,
  markdown,
  scss,
  dart,
  lua,
  perl,
  objectivec,
  r,
  matlab,
  julia,
  dockerfile,
  powershell,
  nginx,
  haskell,
  elixir,
  erlang,
  clojure,
};

Object.keys(languages).forEach((key) => {
  hljs.registerLanguage(key, languages[key]);
});

export default hljs;
