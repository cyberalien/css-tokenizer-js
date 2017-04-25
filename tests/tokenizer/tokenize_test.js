"use strict";

(() => {
    var isBrowser = (typeof module !== 'object' || !module.exports);

    var Tokenizer = isBrowser ? CATokenizer : require('../../src/tokenizer');

    var chai = isBrowser ? self.chai : require('chai'),
        expect = chai.expect,
        should = chai.should();

    describe('Testing tokenizer', () => {
        it('simple block', () => {
            let parser, result;

            // Simple block
            parser = new Tokenizer({
                splitRules: false,
                ignoreErrors: false
            });
            result = parser.tokenize('color: red');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: 'code',
                code: 'color: red',
                index: 0
            }]);

            // Multiple rules, semicolon at the end
            parser = new Tokenizer({
                splitRules: false,
                ignoreErrors: false
            });
            result = parser.tokenize('color: red; opacity: 1; border: 1px solid blue;');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: 'code',
                code: 'color: red; opacity: 1; border: 1px solid blue;',
                index: 0
            }]);

            // Comment, semicolon at start
            parser = new Tokenizer({
                splitRules: false,
                ignoreErrors: false
            });
            result = parser.tokenize(';color: red; /* opacity: 1; */ border: 1px solid blue');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: 'code',
                code: ';color: red; /* opacity: 1; */ border: 1px solid blue',
                index: 0
            }]);
        });

        it('simple selector', () => {
            let parser, result;

            // Simple selector
            parser = new Tokenizer({
                splitRules: false,
                ignoreErrors: false
            });
            result = parser.tokenize('a { Color: Red; }');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: 'a',
                selectors: ['a'],
                index: 0
            }, {
                token: 'code',
                code: 'Color: Red;',
                index: 3
            }, {
                token: '}',
                index: 16
            }]);

            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('a { Color: Red; }');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: 'a',
                selectors: ['a'],
                index: 0
            }, {
                token: 'rule',
                key: 'Color',
                value: 'Red',
                index: 3
            }, {
                token: '}',
                index: 16
            }]);

            // Multiple rules, spacing at start and end
            parser = new Tokenizer({
                splitRules: false,
                ignoreErrors: false
            });
            result = parser.tokenize('\n a[href] { color: red; opacity: .5 \n }\n\n');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: 'a[href]',
                selectors: ['a[href]'],
                index: 0
            }, {
                token: 'code',
                code: 'color: red; opacity: .5',
                index: 11
            }, {
                token: '}',
                index: 38
            }]);

            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('\n a[href] { color: red; opacity: .5 \n }\n\n');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: 'a[href]',
                selectors: ['a[href]'],
                index: 0
            }, {
                token: 'rule',
                key: 'color',
                value: 'red',
                index: 11
            }, {
                token: 'rule',
                key: 'opacity',
                value: '.5',
                index: 23
            }, {
                token: '}',
                index: 38
            }]);

            // Simple @rule
            parser = new Tokenizer({
                splitRules: true,
                ignoreErrors: false
            });
            result = parser.tokenize('@page :left {\n margin-left: 4cm;\n margin-right: 3cm !important;\n}');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: '@page :left',
                atRule: 'page',
                atValues: [':left'],
                index: 0
            }, {
                token: 'rule',
                key: 'margin-left',
                value: '4cm',
                index: 13
            }, {
                token: 'rule',
                key: 'margin-right',
                value: '3cm',
                important: true,
                index: 32
            }, {
                token: '}',
                index: 64
            }]);
        });

        it('code with comments', () => {
            let parser, result;

            // Comments
            parser = new Tokenizer({
                splitRules: false,
                ignoreErrors: false
            });
            result = parser.tokenize('/* comment at start */.foo, /* comment in selector */a[href], b { color: red; /* margin: 0; */ opacity: .5; }\n/* the end */');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: '.foo, a[href], b',
                selectors: ['.foo', 'a[href]', 'b'],
                index: 0
            }, {
                token: 'code',
                code: 'color: red; /* margin: 0; */ opacity: .5;',
                index: 65
            }, {
                token: '}',
                index: 108
            }, {
                token: 'code',
                code: '/* the end */',
                index: 109
            }]);

            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('/* comment at start */.foo, /* comment in selector */a[href], b { color: red; /* margin: 0; */ opacity: .5; }\n/* the end */');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: '.foo, a[href], b',
                selectors: ['.foo', 'a[href]', 'b'],
                index: 0
            }, {
                token: 'rule',
                key: 'color',
                value: 'red',
                index: 65
            }, {
                token: 'rule',
                key: 'opacity',
                value: '.5',
                index: 77
            }, {
                token: '}',
                index: 108
            }]);
        });

        it('escaped strings', () => {
            let parser, result;

            // Escaped string
            parser = new Tokenizer({
                splitRules: false,
                ignoreErrors: false
            });
            result = parser.tokenize('div:after { content: "test; line } \\"; " }');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: 'div:after',
                selectors: ['div:after'],
                index: 0
            }, {
                token: 'code',
                code: 'content: "test; line } \\"; "',
                index: 11
            }, {
                token: '}',
                index: 41
            }]);

            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('div:after { content: "test; line } \\"; " }');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: 'div:after',
                selectors: ['div:after'],
                index: 0
            }, {
                token: 'rule',
                key: 'content',
                value: '"test; line } \\"; "',
                index: 11
            }, {
                token: '}',
                index: 41
            }]);

            // Escaped string in selector
            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('div[href="/*foo{bar}"], span[data-foo=\'test"\\\'str\'] { color: blue !important }');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: 'div[href="/*foo{bar}"], span[data-foo=\'test"\\\'str\']',
                selectors: ['div[href="/*foo{bar}"]', "span[data-foo='test\"\\'str']"],
                index: 0
            }, {
                token: 'rule',
                key: 'color',
                value: 'blue',
                important: true,
                index: 53
            }, {
                token: '}',
                index: 77
            }]);

            // Escaped string in value
            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('font-family: Test\\;1, Arial;');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: 'rule',
                key: 'font-family',
                value: 'Test\\;1, Arial',
                index: 0
            }]);
        });

        it('urls', () => {
            let parser, result;

            // Quoted URL
            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('div { background: url("test;}{url"); color: blue; }');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: 'div',
                selectors: ['div'],
                index: 0
            }, {
                token: 'rule',
                key: 'background',
                value: 'url("test;}{url")',
                index: 5
            }, {
                token: 'rule',
                key: 'color',
                value: 'blue',
                index: 36
            }, {
                token: '}',
                index: 50
            }]);

            // Unquoted URL
            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('div { background: url(data:image/png;base64,whatever/*}{&); color: blue; }');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: 'div',
                selectors: ['div'],
                index: 0
            }, {
                token: 'rule',
                key: 'background',
                value: 'url(data:image/png;base64,whatever/*}{&)',
                index: 5
            }, {
                token: 'rule',
                key: 'color',
                value: 'blue',
                index: 59
            }, {
                token: '}',
                index: 73
            }]);
        });

        it('nested rules', () => {
            let parser, result;

            // Simple nested rule
            parser = new Tokenizer({
                splitRules: false,
                ignoreErrors: false
            });
            result = parser.tokenize('.foo { color: red; border: 1px solid red; &:hover { color: blue; }}');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: '.foo',
                selectors: ['.foo'],
                index: 0
            }, {
                token: 'code',
                code: 'color: red; border: 1px solid red;',
                index: 6
            }, {
                token: '{',
                code: '&:hover',
                selectors: ['&:hover'],
                index: 41
            }, {
                token: 'code',
                code: 'color: blue;',
                index: 51
            }, {
                token: '}',
                index: 65
            }, {
                token: '}',
                index: 66
            }]);

            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('.foo { color: red; border: 1px solid red; &:hover { color: blue; }}');
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql([{
                token: '{',
                code: '.foo',
                selectors: ['.foo'],
                index: 0
            }, {
                token: 'rule',
                key: 'color',
                value: 'red',
                index: 6
            }, {
                token: 'rule',
                key: 'border',
                value: '1px solid red',
                index: 18
            }, {
                token: '{',
                code: '&:hover',
                selectors: ['&:hover'],
                index: 41
            }, {
                token: 'rule',
                key: 'color',
                value: 'blue',
                index: 51
            }, {
                token: '}',
                index: 65
            }, {
                token: '}',
                index: 66
            }]);
        });

        it('at-rule splitting', () => {
            let parser, result;

            // Simple @media
            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('@media foo and bar { color: red; }');
            expect(parser.errors.length).to.be.equal(0);
            result[0].should.be.eql({
                token: '{',
                code: '@media foo and bar',
                atRule: 'media',
                atValues: ['foo and bar'],
                index: 0
            });

            // @media with several entries
            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('@media (min-width: 500px), (min-height: 300px) { color: red; }');
            expect(parser.errors.length).to.be.equal(0);
            result[0].should.be.eql({
                token: '{',
                code: '@media (min-width: 500px), (min-height: 300px)',
                atRule: 'media',
                atValues: ['(min-width: 500px)', '(min-height: 300px)'],
                index: 0
            });

            // @nest
            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize('@nest .foo, .bar { color: red; }');
            expect(parser.errors.length).to.be.equal(0);
            result[0].should.be.eql({
                token: '{',
                code: '@nest .foo, .bar',
                atRule: 'nest',
                atValues: ['.foo', '.bar'],
                index: 0
            });
        });

        it('invalid at-rules', () => {
            let parser, result;

            // Misplaced @import
            let code = '.foo { color: red; @import "bar.css"; opacity: 0 }';
            let expected = [{
                token: '{',
                code: '.foo',
                selectors: ['.foo'],
                index: 0
            }, {
                token: 'rule',
                key: 'color',
                value: 'red',
                index: 6
            }, {
                token: 'code',
                code: '@import "bar.css";',
                index: 18
            }, {
                token: 'rule',
                key: 'opacity',
                value: '0',
                index: 37
            }, {
                token: '}',
                index: 49
            }];

            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize(code);
            expect(parser.errors.length).to.be.equal(1);
            parser.errors[0].getMessage().should.be.equal('Invalid css rule on line 1');
            result.should.be.eql(expected);

            // Same code, ignoring errors
            parser = new Tokenizer();
            result = parser.tokenize(code);
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql(expected);
        });

        it('invalid css', () => {
            let parser, result, code, expected;

            // Missing } at the end
            parser = new Tokenizer({
                ignoreErrors: false
            });
            parser.tokenize('.foo { color: red; border: 1px solid red; &:hover { color: blue; }');
            expect(parser.errors.length).to.be.equal(1);
            parser.errors[0].getMessage().should.be.equal('Missing } on line 1');

            // Extra } at the end
            parser = new Tokenizer({
                ignoreErrors: false
            });
            parser.tokenize(`.foo 
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
            parser.tokenize(`.foo {
                color: red; 
                border: 1px solid red;
                } 
            } 
            .bar { 
                .baz { 
                    color: blue; 
            }`);
            expect(parser.errors.length).to.be.equal(1);
            parser.errors[0].getMessage().should.be.equal('Unexpected } on line 5');

            // Invalid rule
            code = `.foo
            { 
                color: red: blue;
                opacity: 0;
            }`;
            expected = [{
                token: '{',
                code: '.foo',
                selectors: ['.foo'],
                index: 0
            }, {
                // Invalid rule should be returned as code token
                token: 'code',
                code: 'color: red: blue;',
                index: 18
            }, {
                token: 'rule',
                key: 'opacity',
                value: '0',
                index: 53
            }, {
                token: '}',
                index: 94
            }];

            parser = new Tokenizer({
                ignoreErrors: false,
                splitRules: true
            });
            result = parser.tokenize(code);
            expect(parser.errors.length).to.be.equal(1);
            parser.errors[0].getMessage().should.be.equal('Invalid css rule on line 3');
            result.should.be.eql(expected);

            parser = new Tokenizer({
                ignoreErrors: true,
                splitRules: true
            });
            result = parser.tokenize(code);
            expect(parser.errors.length).to.be.equal(0); // Errors are ignored
            result.should.be.eql(expected);

            parser = new Tokenizer({
                ignoreErrors: false,
                splitRules: false
            });
            parser.tokenize(code);
            expect(parser.errors.length).to.be.equal(0); // Cannot detect invalid rules if code isn't split into rules

            // Missing closing quote in string
            parser = new Tokenizer({
                ignoreErrors: false
            });
            parser.tokenize(`.foo["bar] {
                color: red;
            }`);
            expect(parser.errors.length).to.be.equal(1);
            parser.errors[0].getMessage().should.be.equal('Missing closing " on line 1');

            // Missing closing quote in attribute
            code = `.foo[\'bar] {
                color: red;
            }`;
            expected = [{
                token: 'code',
                code: code,
                index: 0,
                error: true
            }];
            parser = new Tokenizer({
                ignoreErrors: false
            });
            result = parser.tokenize(code);
            expect(parser.errors.length).to.be.equal(1);
            parser.errors[0].getMessage().should.be.equal('Missing closing \' on line 1');
            result.should.be.eql(expected);

            // Same as above, but ignoring errors should return different code
            expected = [{
                token: '{',
                code: '.foo[\'bar]',
                selectors: ['.foo[\'bar]'],
                index: 0
            }, {
                token: 'rule',
                key: 'color',
                value: 'red',
                index: 12
            }, {
                token: '}',
                index: 53
            }];
            parser = new Tokenizer();
            result = parser.tokenize(code);
            expect(parser.errors.length).to.be.equal(0);
            result.should.be.eql(expected);

            // Invalid URL
            parser = new Tokenizer({
                ignoreErrors: false
            });
            parser.tokenize(`.foo {
                background-image: url(image/png\ntest);
            }`);
            expect(parser.errors.length).to.be.equal(1);
            parser.errors[0].getMessage().should.be.equal('Incomplete URL on line 2');

            // More than one double colon
            parser = new Tokenizer({
                ignoreErrors: false,
                splitRules: true
            });
            parser.tokenize('.foo { color: red: blue; }');
            expect(parser.errors.length).to.be.equal(1);

            parser = new Tokenizer({
                ignoreErrors: false,
                splitRules: true
            });
            parser.tokenize('.foo { color: url("bar"): blue; }');
            expect(parser.errors.length).to.be.equal(1);
        });
    });
})();
