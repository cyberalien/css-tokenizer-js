"use strict";

(() => {
    var isBrowser = (typeof module !== 'object' || !module.exports);

    var Tokenizer = isBrowser ? CATokenizer : require('../../src/tokenizer');

    var chai = isBrowser ? self.chai : require('chai'),
        expect = chai.expect,
        should = chai.should();

    describe('Testing tree structure', () => {
        it('simple block', () => {
            let parser, result;

            // Without splitting rules
            parser = new Tokenizer({
                splitRules: false
            });
            result = parser.tree('color: red');
            result.should.be.eql([{
                token: 'code',
                code: 'color: red',
                index: 0
            }]);

            // With splitting rules
            parser = new Tokenizer();
            result = parser.tree('color: red; opacity: 1; padding: 0 !important');
            result.should.be.eql([{
                token: 'rule',
                key: 'color',
                value: 'red',
                index: 0
            }, {
                token: 'rule',
                key: 'opacity',
                value: '1',
                index: 11
            }, {
                token: 'rule',
                key: 'padding',
                value: '0',
                important: true,
                index: 23
            }]);
        });

        it('simple selector', () => {
            let parser, result;

            // Simple selector
            parser = new Tokenizer({
                splitRules: false
            });
            result = parser.tree('a { color: red; text-decoration: none }');
            result.should.be.eql([{
                token: '{',
                code: 'a',
                selectors: ['a'],
                index: 0,
                children: [{
                    token: 'code',
                    code: 'color: red; text-decoration: none',
                    index: 3
                }]
            }]);

            parser = new Tokenizer();
            result = parser.tree('a { color: red; text-decoration: none }');
            result.should.be.eql([{
                token: '{',
                code: 'a',
                selectors: ['a'],
                index: 0,
                children: [{
                    token: 'rule',
                    key: 'color',
                    value: 'red',
                    index: 3
                }, {
                    token: 'rule',
                    key: 'text-decoration',
                    value: 'none',
                    index: 15
                }]
            }]);
        });

        it('multiple selectors', () => {
            let parser, result;

            // Simple selector
            parser = new Tokenizer({
                splitRules: false
            });
            result = parser.tree('a { color: red; text-decoration: none }\nb { font-weight: 500; }');
            result.should.be.eql([{
                token: '{',
                code: 'a',
                selectors: ['a'],
                index: 0,
                children: [{
                    token: 'code',
                    code: 'color: red; text-decoration: none',
                    index: 3
                }]
            }, {
                token: '{',
                code: 'b',
                selectors: ['b'],
                index: 39,
                children: [{
                    token: 'code',
                    code: 'font-weight: 500;',
                    index: 43
                }]
            }]);

            parser = new Tokenizer();
            result = parser.tree('a { color: red; text-decoration: none }b{ font-weight: 500; }');
            result.should.be.eql([{
                token: '{',
                code: 'a',
                selectors: ['a'],
                index: 0,
                children: [{
                    token: 'rule',
                    key: 'color',
                    value: 'red',
                    index: 3
                }, {
                    token: 'rule',
                    key: 'text-decoration',
                    value: 'none',
                    index: 15
                }]
            }, {
                token: '{',
                code: 'b',
                selectors: ['b'],
                index: 39,
                children: [{
                    token: 'rule',
                    key: 'font-weight',
                    value: '500',
                    index: 41
                }]
            }]);
        });

        it('nested selectors (normal css)', () => {
            let parser, result;

            parser = new Tokenizer();
            result = parser.tree('a { color: red; text-decoration: none } @media (min-width: 700px) and (orientation: landscape), not all and (monochrome) { a { text-decoration: underline; } }');
            result.should.be.eql([{
                token: '{',
                code: 'a',
                selectors: ['a'],
                index: 0,
                children: [{
                    token: 'rule',
                    key: 'color',
                    value: 'red',
                    index: 3
                }, {
                    token: 'rule',
                    key: 'text-decoration',
                    value: 'none',
                    index: 15
                }]
            }, {
                token: '{',
                code: '@media (min-width: 700px) and (orientation: landscape), not all and (monochrome)',
                atRule: 'media',
                atValues: [
                    '(min-width: 700px) and (orientation: landscape)',
                    'not all and (monochrome)'
                ],
                index: 39,
                children: [{
                    token: '{',
                    code: 'a',
                    selectors: ['a'],
                    index: 122,
                    children: [{
                        token: 'rule',
                        key: 'text-decoration',
                        value: 'underline',
                        index: 126
                    }]
                }]
            }]);
        });

        it('nested selectors with @nest', () => {
            let parser, result;

            parser = new Tokenizer();
            result = parser.tree('.foo { color: blue; & > .bar { color: red; } opacity: 1;}');
            result.should.be.eql([{
                token: '{',
                code: '.foo',
                selectors: ['.foo'],
                index: 0,
                children: [{
                    token: 'rule',
                    key: 'color',
                    value: 'blue',
                    index: 6
                }, {
                    token: '{',
                    code: '& > .bar',
                    selectors: ['& > .bar'],
                    index: 19,
                    children: [{
                        token: 'rule',
                        key: 'color',
                        value: 'red',
                        index: 30
                    }]
                }, {
                    token: 'rule',
                    key: 'opacity',
                    value: '1',
                    index: 44
                }]
            }]);
        });

        it('invalid css', () => {
            let parser, result;

            // Missing } at the end
            parser = new Tokenizer({
                ignoreErrors: false
            });
            parser.tree('.foo { color: red; border: 1px solid red; &:hover { color: blue; }');
            expect(parser.errors.length).to.be.equal(1);
            parser.errors[0].getMessage().should.be.equal('Missing } on line 1');

            // Extra } at the end
            parser = new Tokenizer({
                ignoreErrors: false
            });
            parser.tree(`.foo 
                { 
                    color: red; 
                    border: 1px solid red; 
                    &:hover { 
                        color: blue; 
                    }
                }
            }`);
            expect(parser.errors.length).to.be.equal(1);
            parser.errors[0].getMessage().should.be.equal('Unexpected } on line 9');

            // Extra } in the middle
            parser = new Tokenizer({
                ignoreErrors: false
            });
            parser.tree(`.foo {
                color: red; 
                border: 1px solid red;
                } 
            } 
            .bar { 
                .baz { 
                    color: blue; 
            }`);
            expect(parser.errors.length).to.be.equal(2);
            parser.errors[0].getMessage().should.be.equal('Unexpected } on line 5');
            parser.errors[1].getMessage().should.be.equal('Unmatched } on line 6');
        });
    });
})();
