import * as babel from "@babel/core";
import plugin from "./babelPlugin";
import * as prettier from "prettier";
import getBabelOptions from "./getBabelOptions";

var sourceMapRegex = /\/\/#[\W]*sourceMappingURL=.*$/;
function removeSourceMapIfAny(code) {
  // In theory we might be able to use this source map, but right now
  // 1) parsing source maps on the frontend is hard, because FE JS doesn't
  //    natively support parsing UTF-8 base64 which is used for inline source maps
  // 2) It could break things if we don't take it out, so need to do some work
  //    to handle the existing source map properly
  if (sourceMapRegex.test(code)) {
    var sourceMapComment = code.match(/\/\/#[\W]*sourceMappingURL=.*$/)[0];
    code = code.replace(sourceMapComment, "");
  }
  return code;
}

export default function transform(code, extraBabelOptions = {}) {
  return new Promise((resolve, reject) => {
    let result;
    try {
      result = compileSync(code, extraBabelOptions);
    } catch (err) {
      reject(err);
    }
    // prettify code is helpful for debugging, but it's slow
    // result.code = prettier.format(result.code, { parser: "babylon" });

    resolve(result);
  });
}

export function compileSync(code, extraBabelOptions = {}, url = "/no_url.js") {
  code = removeSourceMapIfAny(code);
  const babelResult = babel.transform(
    code,
    getBabelOptions(plugin, extraBabelOptions, url)
  );
  return {
    map: babelResult.map,
    code: babelResult.code + "\n//# sourceMappingURL=" + url + ".map"
  };
}
