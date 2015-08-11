function* generator(i) {
    yield i + 1;
    yield i + 2;
    yield i + 3;
}

var gen = generator(10);

console.log(gen.next().value); // 11
console.log(gen.next().value); // 12
console.log(gen.next().value); // 13