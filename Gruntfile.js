module.exports = function(grunt) {

    grunt.initConfig({
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app1: {
                files: {
                    'dist/gw-api.js': [
                        'lib/*.js',
                        'src/*.js'
                    ]
                }
            }
        },
        uglify: {
            app1: {
                files: {
                    'dist/gw-api.min.js': [
                        'dist/gw-api.js'
                    ]
                }
            }
        },
        add_comment: {
            app1: {
                options: {
                    comments: ['Compiled ' + new Date()],
                    carriageReturn: "\n",
                    prepend: true,
                    syntaxes: {
                        '.js': '//',
                        '.css': ['/*', '*/']
                    }
                },
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**/*.js', '**/*.css'],
                    dest: 'dist/'
                }]
            }
        },
        watch: {
            scripts: {
                files: ['src/*'],
                tasks: ['default'],
                options: {
                    spawn: false
                }
            }
        }
    });


    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-add-comment');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['ngAnnotate', 'uglify', 'add_comment']);

};