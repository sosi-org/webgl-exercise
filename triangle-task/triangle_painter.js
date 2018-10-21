'use strict;'

function OpenglTrianglePainter() {


    this.init = function(gl) {

        /*
            uniform: variables that change per "primitive". Shader input. Both vertex or fragment shaders. Read-only.
                    Constant during: a "draw" call.
            attribute: variables that may change per vertex. Used in: vertex shader (only). Is read-only. Is input.
                    Vary from vertex to vertex. (per vertex)
            varying: interpolated data shared. Vertex->Fragment. Vertex shader: output. Fragment shader: input.
                    Not constant: vary from pixel to pixel (per pixel).

            Pipeline: "via varying" or implicit.
                    vertes shader -> other shaders -> fragment shader


            [1] https://stackoverflow.com/questions/17537879/in-webgl-what-are-the-differences-between-an-attribute-a-uniform-and-a-varying
        */

        const VERTEX_SHADER =
        `
        //***************************************
        //  VERTEX shader
        //***************************************

        //code 1
        attribute vec2 a_position2d;
        // code 2
        //attribute vec4 aVertexPosition;

        attribute vec2 aTextureCoord;
        varying highp vec2 vTextureCoord;

        void main() {
            gl_Position =  (vec4(a_position2d, 0.0, 1.0));
            vTextureCoord = aTextureCoord;
        }
        `;

        const FRAGMENT_SHADER =
         // fragment shader:
        `
        //***************************************
        //  FRAGMENT shader
        //***************************************
        precision mediump float;
        uniform vec3 u_color;

        varying highp vec2 vTextureCoord;
        uniform sampler2D uSampler;

        void main() {
            gl_FragColor = texture2D(uSampler, vTextureCoord) + vec4(u_color,0.0);
        }
        `

        var shaderProgram = buildShaderProgram(gl,
            VERTEX_SHADER,
            FRAGMENT_SHADER
        );
        this.shaderProgram = shaderProgram;

        this.refs = {
          //program: shaderProgram,
          attribLocations: {
            // for need for 'vTextureCoord'
            //vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            a_position2d: gl.getAttribLocation(shaderProgram, 'a_position2d'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
          },
          uniformLocations: {
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
          },
        };

        console.log(this.refs);

        this.gl = gl;
    }

    function  feed_attrib_with_filled_buffer(gl, attrib_index, attrib_buffer, num_per_vertex)
    {
        //texture_coords(gl, textureCoordBuffer, this.refs);
        //const num_per_vertex = 2; // every coordinate composed of 2 values
        const type = gl.FLOAT; // the data in the buffer is 32 bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, attrib_buffer);
        gl.vertexAttribPointer(attrib_index, num_per_vertex, type, normalize, stride, offset);
        gl.enableVertexAttribArray(attrib_index);
    };

    this.draw_everything = function (gl, vertexCoords_array, triangle_vertices, brightnessBoost, texture)
    {
        var buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);  // Set this buffer as the current one for the next buffer operations
        gl.bufferData(gl.ARRAY_BUFFER, vertexCoords_array, gl.STATIC_DRAW);

        var sh_color = gl.getUniformLocation(this.shaderProgram, "u_color");
        gl.uniform3f(sh_color, brightnessBoost[0], brightnessBoost[1], brightnessBoost[2]);

        //gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCoords_array.length/coordDimensions);
        gl.clearColor(0, 0, 0, 1); // defaults to white (1,1,1)
        gl.clear(gl.COLOR_BUFFER_BIT);


        /*
            For Future use:
          gl.uniformMatrix4fv(
              programInfo.uniformLocations.projectionMatrix,
              false,
              projectionMatrix);
          gl.uniformMatrix4fv(
              programInfo.uniformLocations.modelViewMatrix,
              false,
              modelViewMatrix);
        */


        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        const indices = [ 0,  1,  2,  ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);



        textureCoordBuffer = make_buffer(gl, new Float32Array([
                        0.0,  0.0,
                        1.0,  0.0,
                        1.0,  1.0,
                        0.0,  1.0,
                    ]));

        feed_attrib_with_filled_buffer(gl, this.refs.attribLocations.textureCoord, textureCoordBuffer, 2)


        // MISSING PART!
        var position_attrib_buffer = make_buffer(gl, triangle_vertices);

        feed_attrib_with_filled_buffer(gl, this.refs.attribLocations.a_position2d, position_attrib_buffer, 2);


        gl.useProgram(this.shaderProgram);


        // Tell WebGL we want to affect texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        // Bind the texture to texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Tell the shader we bound the texture to texture unit 0
        gl.uniform1i(this.refs.uniformLocations.uSampler, 0);

        {
          const vertexCount = 3; ////36;
          const type = gl.UNSIGNED_SHORT;
          const offset = 0;
          gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
    }; // draw_everything
};


console.log("hi");