"use strict";

(() => {
    var isBrowser = (typeof module !== 'object' || !module.exports);

    var Tokenizer = isBrowser ? CATokenizer : require('../../src/tokenizer');

    var chai = isBrowser ? self.chai : require('chai'),
        expect = chai.expect,
        should = chai.should();

    describe('Testing less tokenizer', () => {
        it('simple mixin', () => {
            let parser, result;

            parser = new Tokenizer({
                ignoreErrors: false,
                lessSyntax: true
            });
            result = parser.tokenize('.box-shadow() { color: red; }');
            expect(parser.errors.length).to.be.equal(0);
            result.forEach(item => {
                delete item.index;
            });
            result.should.be.eql([{
                token: '{',
                code: '.box-shadow()',
                selectors: ['.box-shadow()']
            }, {
                token: 'rule',
                key: 'color',
                value: 'red'
            }, {
                token: '}'
            }]);
        });

        it('variables', () => {
            let parser, result;

            // Code with variables
            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('$test: black; $foo: lighten(#400, 20%); a { color: $test; }');
            expect(parser.errors.length).to.be.equal(0);
            result.forEach(item => {
                delete item.index;
            });
            result.should.be.eql([{
                token: 'rule',
                key: '$test',
                value: 'black'
            }, {
                token: 'rule',
                key: '$foo',
                value: 'lighten(#400, 20%)'
            }, {
                token: '{',
                code: 'a',
                selectors: ['a']
            }, {
                token: 'rule',
                key: 'color',
                value: '$test'
            }, {
                token: '}'
            }]);

            // Mixin with variables
            parser = new Tokenizer({
                ignoreErrors: false,
                lessSyntax: true
            });
            result = parser.tokenize(`.mixin(@color: black; @margin: 10px; @padding: 20px) {
  color: @color;
  margin: @margin;
  padding: @padding;
}
.class1 {
  .mixin(@margin: 20px; @color: #33acfe);
}
.class2 {
  .mixin(lighten(#efca44, 10%); @padding: 40px);
}`);
            expect(parser.errors.length).to.be.equal(0);
            result.forEach(item => {
                delete item.index;
            });

            result.should.be.eql([{
                token: '{',
                code: '.mixin(@color: black; @margin: 10px; @padding: 20px)',
                selectors: ['.mixin(@color: black; @margin: 10px; @padding: 20px)']
            }, {
                token: 'rule',
                key: 'color',
                value: '@color'
            }, {
                token: 'rule',
                key: 'margin',
                value: '@margin'
            }, {
                token: 'rule',
                key: 'padding',
                value: '@padding'
            }, {
                token: '}'
            }, {
                token: '{',
                code: '.class1',
                selectors: ['.class1']
            }, {
                token: 'code',
                code: '.mixin(@margin: 20px; @color: #33acfe);'
            }, {
                token: '}'
            }, {
                token: '{',
                code: '.class2',
                selectors: ['.class2']
            }, {
                token: 'code',
                code: '.mixin(lighten(#efca44, 10%); @padding: 40px);'
            }, {
                token: '}'
            }]);
        });

        it('mixin with variables', () => {
            let parser, result;

            parser = new Tokenizer({
                ignoreErrors: false,
                lessSyntax: true
            });
            result = parser.tokenize(`.box-shadow(@style, @c) when (iscolor(@c)) {
  -webkit-box-shadow: @style @c;
  box-shadow:         @style @c;
}
.box-shadow(@style, @alpha: 50%) when (isnumber(@alpha)) {
  .box-shadow(@style, rgba(0, 0, 0, @alpha));
}
.box {
  color: saturate(@base, 5%);
  border-color: lighten(@base, 30%);
  div { .box-shadow(0 0 5px, 30%) }
}
`);
            expect(parser.errors.length).to.be.equal(0);
            result.forEach(item => {
                delete item.index;
            });

            result.should.be.eql([{
                token: '{',
                code: '.box-shadow(@style, @c) when (iscolor(@c))',
                selectors: ['.box-shadow(@style, @c) when (iscolor(@c))']
            }, {
                token: 'rule',
                key: '-webkit-box-shadow',
                value: '@style @c'
            }, {
                token: 'rule',
                key: 'box-shadow',
                value: '@style @c'
            }, {
                token: '}'
            }, {
                token: '{',
                code: '.box-shadow(@style, @alpha: 50%) when (isnumber(@alpha))',
                selectors: ['.box-shadow(@style, @alpha: 50%) when (isnumber(@alpha))']
            }, {
                token: 'code',
                code: '.box-shadow(@style, rgba(0, 0, 0, @alpha));'
            }, {
                token: '}'
            }, {
                token: '{',
                code: '.box',
                selectors: ['.box']
            }, {
                token: 'rule',
                key: 'color',
                value: 'saturate(@base, 5%)'
            }, {
                token: 'rule',
                key: 'border-color',
                value: 'lighten(@base, 30%)'
            }, {
                token: '{',
                code: 'div',
                selectors: ['div']
            }, {
                token: 'code',
                code: '.box-shadow(0 0 5px, 30%)'
            }, {
                token: '}'
            }, {
                token: '}'
            }]);
        });

    });
})();
