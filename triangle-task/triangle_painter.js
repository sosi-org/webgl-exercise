'use strict;'

function OpenglTrianglePainter() {

    this.init_shaders = function(gl) {
        // init()

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

            attribute vec2 a_triangleCorner_vertexPosition2d;
            attribute vec2 textureCornerVectexCoord;

            varying highp vec2 vTextureCoord;
            //varying = will be interpolated. output.

            void main() {
                gl_Position =  (vec4(a_triangleCorner_vertexPosition2d, 0.0, 1.0));
                vTextureCoord = textureCornerVectexCoord;
            }
        `;

        const FRAGMENT_SHADER =
        `
            //***************************************
            //  FRAGMENT shader
            //***************************************
            precision mediump float;

            uniform vec3 uBrightnessColour;
            uniform sampler2D uSampler;

            // varying = interpolated. input.
            varying highp vec2 vTextureCoord;

            void main() {
                gl_FragColor = texture2D(uSampler, vTextureCoord) + vec4(uBrightnessColour, 0.0);
            }
        `

        var shaderProgram = buildShaderProgram(gl,
            VERTEX_SHADER,
            FRAGMENT_SHADER
        );
        this.shaderProgram = shaderProgram;

        // Gives access to variables defined inside the shaders:
        this.refs = {

            a_triangleCorner_vertexPosition2d: gl.getAttribLocation(shaderProgram, 'a_triangleCorner_vertexPosition2d'),
            a_textureVertex_position2d: gl.getAttribLocation(shaderProgram, 'textureCornerVectexCoord'),

            u_brightness: gl.getUniformLocation(shaderProgram, "uBrightnessColour"),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),

        };

        console.log(this.refs);
    }


    // IBO
    function make_index_buffer(gl, indices)
    {
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        //const indices = [ 0,  1,  2,  ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        // not used
        // return indexBuffer;
    }

    // private
    // Vertex Buffer Object (VBO)
    function make_vertex_buffer(gl, floatCoordinates)
    {
        const buffer = gl.createBuffer();
        // Set this buffer as the current one for the next buffer operations:
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);   // Set this buffer as the current one
        gl.bufferData(gl.ARRAY_BUFFER, floatCoordinates,  gl.STATIC_DRAW);
        return buffer;
    }

    function  feed_vertex_attrib_with_filled_buffer(gl, attrib_index, attrib_buffer, num_per_vertex)
    {
        //texture_coords(gl, textureCoordBuffer, this.refs);
        //const num_per_vertex = 2; // every coordinate composed of 2 values
        const type = gl.FLOAT; // the data in the buffer is 32 bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from

        gl.bindBuffer(gl.ARRAY_BUFFER, attrib_buffer);  // not actually necessary

        gl.vertexAttribPointer(attrib_index, num_per_vertex, type, normalize, stride, offset);
        gl.enableVertexAttribArray(attrib_index);
    };

    this.draw_textured_triangle = function (gl, texture_coords_array, triangle_vertices, brightnessBoost, texture)
    {

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

        // =====================
        // Feed attributes
        // =====================
        // Feed indices (IBO)
        const indices = [ 0,  1,  2,  ];
        make_index_buffer(gl, indices);

        // Feed vertices (VBO): texture
        let textureCoordBuffer = make_vertex_buffer(gl, texture_coords_array);
        feed_vertex_attrib_with_filled_buffer(gl, this.refs.a_textureVertex_position2d, textureCoordBuffer, 2)
        // Feed vertices (VBO): vertices   // MISSING PART!
        var position_attrib_buffer = make_vertex_buffer(gl, triangle_vertices);
        feed_vertex_attrib_with_filled_buffer(gl, this.refs.a_triangleCorner_vertexPosition2d, position_attrib_buffer, 2);


        // necessary to do before feeding the uniforms
        gl.useProgram(this.shaderProgram);

        // =====================
        // feed the uniforms
        // =====================

        // feed one uniform (not array)
        // uniform3f() must be called after useProgram(). This is necessary for all "uniform"s?
        //var u_brightness = gl.getUniformLocation(this.shaderProgram, "uBrightnessColour");
        gl.uniform3f(this.refs.u_brightness, brightnessBoost[0], brightnessBoost[1], brightnessBoost[2]);

        // How to feed a texture:
        gl.activeTexture(gl.TEXTURE0);   // Tell WebGL we want to affect texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);        // Bind the texture to texture unit 0
        gl.uniform1i(this.refs.uSampler, 0);        // Tell the shader we bound the texture to texture unit 0

        // =====================
        // now, go.
        // =====================
        {
          const vertexCount = 3;
          const type = gl.UNSIGNED_SHORT;
          const offset = 0;
          gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }

        /*
        var textureCoordBuffer = make_vertex_buffer(vertexCoords_array);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCoords_array.length/coordDimensions);
        */

    }; // draw_textured_triangle

};
