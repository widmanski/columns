module.exports = function( grunt ) {


    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    grunt.initConfig({

        version: grunt.file.readJSON('package.json').version,

        jshint: {
   
            build: {
                src: ['Gruntfile.js']
            },
            src: {
                src: 'src/*.js'
            },
            options: {
              curly: true,
              eqeqeq: true,
              eqnull: true,
              browser: true,
              globals: {
                jQuery: true
              },
              force: true
            }
        },


      watch: {
         
          js: {
            files: ['src/*.js'],

            tasks: ['uglify', 'jshint']
          },
        
          livereload: {

            files: ['src/*.js'],
            options: {
              livereload: true
            }
          },
        },

         uglify: {
 
          scripts: {
            files: {
              'dist/columns.min.js': [
                'src/*.js'
                ]
            }
          }
        },

        'http-server': {
          'dev': {
                  // the server root directory
                  root: "demo/",

                  port: 8282,
                  host: "127.0.0.1",

                  cache: 0,
                  showDir : true,
                  autoIndex: true,
                  defaultExt: "html",

                  //wait or not for the process to finish
                  runInBackground: true
              }
          
        }

    

    });


  grunt.registerTask('default', ['jshint','uglify']);


  // Handle Various Images Task
  grunt.registerTask('images', ['svg2png','svgmin','imagemin']);



  grunt.registerTask('test', ['http-server', 'watch']);

  

    
};