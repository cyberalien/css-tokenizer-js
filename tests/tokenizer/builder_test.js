"use strict";

(() => {
    var isBrowser = (typeof module !== 'object' || !module.exports);

    var Tokenizer = isBrowser ? CATokenizer : require('../../src/tokenizer');

    var chai = isBrowser ? self.chai : require('chai'),
        expect = chai.expect,
        should = chai.should();

    describe('Testing building css from tokens', () => {
        it('simple code tokens', () => {
            let result;

            // 1 code block
            result = Tokenizer.build([{
                token: 'code',
                code: 'color: red'
            }]);
            result.should.be.equal('color: red');

            // 2 code blocks
            result = Tokenizer.build([{
                token: 'code',
                code: 'color: red;'
            }, {
                token: 'code',
                code: 'alpha: 1;'
            }]);
            result.should.be.equal('color: red;\nalpha: 1;');
        });

        it('simple rules', () => {
            let result;

            // 1 rule
            result = Tokenizer.build([{
                token: 'rule',
                key: 'color',
                value: 'red'
            }]);
            result.should.be.equal('color: red;');

            // 2 rules
            result = Tokenizer.build([{
                token: 'rule',
                key: 'color',
                value: 'red'
            }, {
                token: 'rule',
                key: 'text-decoration',
                value: 'none',
                important: true
            }]);
            result.should.be.equal('color: red;\ntext-decoration: none !important;');
        });

        it('list of selectors', () => {
            let result;

            // One simple selector
            result = Tokenizer.build([{
                token: '{',
                code: 'a[href]', // no selectors property
            }, {
                token: 'rule',
                key: 'color',
                value: 'red'
            }, {
                token: 'rule',
                key: 'opacity',
                value: '.5'
            }, {
                token: '}'
            }]);
            result.should.be.equal('a[href]\n{\n\tcolor: red;\n\topacity: .5;\n}');

            // 2 levels
            result = Tokenizer.build([{
                token: '{',
                selectors: ['.foo'] // no code property
            }, {
                token: 'rule',
                key: 'color',
                value: 'red'
            }, {
                token: 'rule',
                key: 'border',
                value: '1px solid red'
            }, {
                token: '{',
                // different values for code and selectors - selectors list is used
                code: '&:focus',
                selectors: ['&:hover']
            }, {
                token: 'rule',
                key: 'color',
                value: 'blue'
            }, {
                token: '}'
            }, {
                token: '}'
            }]);
            result.should.be.equal('.foo\n{\n\tcolor: red;\n\tborder: 1px solid red;\n\t&:hover\n\t{\n\t\tcolor: blue;\n\t}\n}');

            // at rule without value
            result = Tokenizer.build([{
                token: '{',
                atRule: 'foo',
                code: '.ignored',
            }, {
                token: 'rule',
                key: 'color',
                value: 'red'
            }, {
                token: '}'
            }]);
            result.should.be.equal('@foo\n{\n\tcolor: red;\n}');
        });

        it('tree of selectors', () => {
            let result;

            // One simple selector
            result = Tokenizer.build([{
                token: '{',
                code: '.foo',
                children: [{
                    token: 'rule',
                    key: 'color',
                    value: 'blue'
                }, {
                    token: '{',
                    selectors: ['& > .bar'],
                    children: [{
                        token: 'rule',
                        key: 'color',
                        value: 'red'
                    }]
                }, {
                    token: 'rule',
                    key: 'opacity',
                    value: '1'
                }]
            }]);
            result.should.be.equal('.foo\n{\n\tcolor: blue;\n\t& > .bar\n\t{\n\t\tcolor: red;\n\t}\n\topacity: 1;\n}');
        });

        it('test compact layout', () => {
            let result;

            result = Tokenizer.build((new Tokenizer().tokenize(`
                @media (min-width: 100px) and (min-height: 50px), (min-height: 200px) {
                  .foo {
                    color: blue;
                  }
                }
                @media (min-width: 100px) and (min-height: 50px) and (max-width: 500px), (min-height: 200px) and (max-width: 500px), (min-width: 100px) and (min-height: 50px) and (max-width: 900px), (min-height: 200px) and (max-width: 900px) {
                  .foo {
                    color: purple;
                  }
                }
            `)), {
                newLineAfterSelector: false
            });
            result.should.be.equal('@media (min-width: 100px) and (min-height: 50px), (min-height: 200px) {\n\t.foo {\n\t\tcolor: blue;\n\t}\n}\n\n@media (min-width: 100px) and (min-height: 50px) and (max-width: 500px), (min-height: 200px) and (max-width: 500px), (min-width: 100px) and (min-height: 50px) and (max-width: 900px), (min-height: 200px) and (max-width: 900px) {\n\t.foo {\n\t\tcolor: purple;\n\t}\n}');
        });
    });
})();
