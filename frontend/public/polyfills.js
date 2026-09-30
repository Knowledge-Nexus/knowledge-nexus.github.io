// Carregado antes da aplicação (script clássico). O pdf.js usa APIs muito recentes
// (Map/WeakMap.prototype.getOrInsert[Computed]) que browsers menos actuais não têm.
(function () {
  for (const C of [Map, WeakMap]) {
    const proto = C.prototype;
    if (!proto.getOrInsert) {
      proto.getOrInsert = function (key, value) {
        if (!this.has(key)) this.set(key, value);
        return this.get(key);
      };
    }
    if (!proto.getOrInsertComputed) {
      proto.getOrInsertComputed = function (key, compute) {
        if (!this.has(key)) this.set(key, compute(key));
        return this.get(key);
      };
    }
  }
})();
