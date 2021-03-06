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
            //attribute vec2 a_BGRectCornerXY;

            //uniform vec2 texture_offset;

            varying highp vec2 vTextureCoord;
            //varying highp vec2 v_BGTextureXY;
            //varying = will be interpolated. output.

            void main() {
                gl_Position =  (vec4(a_triangleCorner_vertexPosition2d, 0.0, 1.0));
                vTextureCoord = textureCornerVectexCoord;
                /*
                //vTextureCoord = (textureCornerVectexCoord + texture_offset) % vec2(1.,1.);
                vTextureCoord.x = mod2pn(textureCornerVectexCoord.x + texture_offset.x);
                vTextureCoord.y = mod2pn(textureCornerVectexCoord.y + texture_offset.y);
                //v_BGTextureXY = a_BGRectCornerXY;
                */
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
            //uniform sampler2D uBGSampler;

            //uniform vec2 texture_offset;
            uniform vec2 texture_offset;

            // varying = interpolated. input.
            varying highp vec2 vTextureCoord;
            //varying highp vec2 v_BGTextureXY;

            float mod2pn(float x) {
                //return mod(x, 2.0);
                //return mod(mod(x+1.0, 2.0)+2.0,2.0)-1.0;
                //const float Q = 2.;
                //const float HQ = Q * 0.5;
                const float Q = 1.;
                const float HQ = 0.0;
                return mod(mod(x+HQ, Q)+Q, Q)-HQ;
            }
            vec2 mod2pn2d(vec2 v) {
                return vec2(mod2pn(v.x), mod2pn(v.y));
            }

            void main() {
                gl_FragColor =
                    //texture2D(uSampler, vTextureCoord  /*+ texture_offset*/)
                    texture2D(uSampler, mod2pn2d(vTextureCoord  + texture_offset))
                    + vec4(uBrightnessColour, 0.0)
                    //+ texture2D(uBGSampler, v_BGTextureXY) * 0.5
                    ;
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
            //a_BGRectCornerXY: gl.getAttribLocation(shaderProgram, 'a_BGRectCornerXY'),

            u_texture_offset: gl.getUniformLocation(shaderProgram, 'texture_offset'),

            u_brightness: gl.getUniformLocation(shaderProgram, "uBrightnessColour"),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
            //uBGSampler: gl.getUniformLocation(shaderProgram, 'uBGSampler'),


            //v_BGTextureXY

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

    this.clear = function (gl)
    {
        gl.clearColor(0, 0, 0, 1); // defaults to white (1,1,1)
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    this.draw_textured_triangle = function (gl, texture_coords_array, triangle_vertices, brightnessBoost, texture, num_vertices, tex_offset)
    {

        //gl.clearColor(0, 0, 0, 1); // defaults to white (1,1,1)
        //gl.clear(gl.COLOR_BUFFER_BIT);


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
        //const indices = [ 0,  1,  2,     2,1,3];
        var indices_;
        if (num_vertices == 6) {
            indices_ = [      1, 2,3,   0,  1, 3,];
        }else if (num_vertices == 3) {
            indices_ = [      0,1, 2,];
        } else {
            console.error("Can only be 3 or 6.");
        }
        const indices = indices_;
        make_index_buffer(gl, indices);

        const bg_rect = new Float32Array([0.,0., 1.,0.,  1.,1., 0.,1.]);

        // Feed vertices (VBO): texture
        let textureCoordBuffer = make_vertex_buffer(gl, texture_coords_array);
        feed_vertex_attrib_with_filled_buffer(gl, this.refs.a_textureVertex_position2d, textureCoordBuffer, 2)
        let BGTextureRectCoordBuffer = make_vertex_buffer(gl, bg_rect);
        feed_vertex_attrib_with_filled_buffer(gl, this.refs.a_BGRectCornerXY, BGTextureRectCoordBuffer, 2)

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
        if (brightnessBoost) {
            gl.uniform3f(this.refs.u_brightness, brightnessBoost[0], brightnessBoost[1], brightnessBoost[2]);
        }

        if (tex_offset) {
            gl.uniform2f(this.refs.u_texture_offset, tex_offset[0], tex_offset[1]);
        }

        // How to feed a texture:
        tx = [gl.TEXTURE0, gl.TEXTURE1];
        const tindex = 0;
        gl.activeTexture(tx[tindex]);   // Tell WebGL we want to affect texture unit 0
        gl.bindTexture(gl.TEXTURE_2D, texture);        // Bind the texture to texture unit 0
        gl.uniform1i(this.refs.uSampler, tindex);        // Tell the shader we bound the texture to texture unit 0


        // =====================
        // now, go.
        // =====================
        if (true)
        {
          const vertexCount = num_vertices; //3 //3+3;
          const type = gl.UNSIGNED_SHORT;
          const offset = 0;
          gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
        }
        if (false) {
            //const vertexCount = 4;
            const vertexCount = 4;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
        }

        /*
        var textureCoordBuffer = make_vertex_buffer(vertexCoords_array);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCoords_array.length/coordDimensions);
        */

    }; // draw_textured_triangle

};
