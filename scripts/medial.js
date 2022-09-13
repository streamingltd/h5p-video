/** @namespace H5P */
H5P.VideoMedial = (function ($) {

  /**
   * Medial video player for H5P.
   *
   * @class
   * @param {Array} sources Video files to use
   * @param {Object} options Settings for the player
   * @param {Object} l10n Localization strings
   */
  function Medial(sources, options, l10n) {
    var self = this;

    var player;
    var videoPath;
    var playbackRate = 1;
    var id = 'h5p-medial-' + numInstances;
    numInstances++;

    var $wrapper = $('<div/>');
    var $placeholder = $('<div/>', {
      id: id,
      text: l10n.loading
    }).appendTo($wrapper);

    /**
     * Use the Medial API to create a new player
     *
     * @private
     */
    var create = function () {
      if (!$placeholder.is(':visible') || player !== undefined) {
        return;
      }

      var width = $wrapper.width();
      if (width < 200) {
        width = 200;
      }

      videoPath = getPath(sources[0].path);

      var element = $('<iframe/>', {
            id: id,
            src: videoPath,
            width: width,
            height: (width * (9/16)) + 8,
            allow: "accelerometer; fullscreen"
        });

      $placeholder.replaceWith(element);

      window.document.body.appendChild(Object.assign(document.createElement('script'), {
        type: 'text/javascript',
        src: 'https://cdn.embed.ly/player-0.1.0.min.js',
        onload: () => playerJSLoaded()
      }));
    }

    var playerJSLoaded = function() {
      // Player.js doesn't like the object returned by JQuery $('#'+id), so use a standard call here.
      var frame = document.getElementById(id);
      player = new playerjs.Player(frame);

      player.on('ready', () => {
        console.log('Player.js ready');
        self.trigger('loaded');
        self.trigger('ready');
        // Trigger stateChange will cause the Interactive video overlay to be shown.
        self.trigger('stateChange');
      });

      console.log('Player.js loaded');
    };


    /**
     * Indicates if the video must be clicked for it to start playing.
     * For instance Medial videos on iPad must be pressed to start playing.
     *
     * @public
     */
    self.pressToPlay = true;

    /**
    * Appends the video player to the DOM.
    *
    * @public
    * @param {jQuery} $container
    */
    self.appendTo = function ($container) {
      $container.addClass('h5p-medial').append($wrapper);
      create();
    };

    /**
     * Get list of available qualities. Not available until after play.
     *
     * @public
     * @returns {Array}
     */
    self.getQualities = function () {
        // Not yet supported
    };

    /**
     * Get current playback quality. Not available until after play.
     *
     * @public
     * @returns {String}
     */
    self.getQuality = function () {
        // Not yet supported
    };

    /**
     * Set current playback quality. Not available until after play.
     * Listen to event "qualityChange" to check if successful.
     *
     * @public
     * @params {String} [quality]
     */
    self.setQuality = function (quality) {
        // Not yet supported
    };

    /**
     * Start the video.
     *
     * @public
     */
    self.play = function () {
      if (!player || !player.supports('method', 'play')) {
        self.on('ready', self.play);
        return;
      }

      player.play();
    };

    /**
     * Pause the video.
     *
     * @public
     */
    self.pause = function () {
      self.off('ready', self.play);
      if (!player || !player.supports('method', 'pause')) {
        return;
      }
      
      player.pause();
    };

    /**
     * Seek video to given time.
     *
     * @public
     * @param {Number} time
     */
    self.seek = function (time) {
      if (!player || !player.supports('method', 'setCurrentTime')) {
        return;
      }
      
      player.setCurrentTime(time);
    };

    /**
     * Get elapsed time since video beginning.
     *
     * @public
     * @returns {Number}
     */
    self.getCurrentTime = function () {
      if (!player || !player.supports('method', 'getCurrentTime')) {
        return;
      }
      
      return player.getCurrentTime();
    };

    /**
     * Get total video duration time.
     *
     * @public
     * @returns {Number}
     */
    self.getDuration = function () {
      if (!player || !player.supports('method', 'getDuration')) {
        return;
      }
      
      return player.getDuration();
    };

    /**
     * Get percentage of video that is buffered.
     *
     * @public
     * @returns {Number} Between 0 and 100
     */
    self.getBuffered = function () {
        // Not supported yet
    };

    /**
     * Turn off video sound.
     *
     * @public
     */
    self.mute = function () {
      if (!player || !player.supports('method', 'mute')) {
        return;
      }

      player.mute();
    };

    /**
     * Turn on video sound.
     *
     * @public
     */
    self.unMute = function () {
      if (!player || !player.supports('method', 'unmute')) {
        return;
      }
      
      player.unmute();
    };

    /**
     * Check if video sound is turned on or off.
     *
     * @public
     * @returns {Boolean}
     */
    self.isMuted = function () {
      if (!player || !player.supports('method', 'getMuted')) {
        return;
      }
      
      return player.getMuted();
    };

    /**
     * Return the video sound level.
     *
     * @public
     * @returns {Number} Between 0 and 100.
     */
    self.getVolume = function () {
      if (!player || !player.supports('method', 'getVolume')) {
        return;
      }
      
      return player.getVolume();
    };

    /**
     * Set video sound level.
     *
     * @public
     * @param {Number} level Between 0 and 100.
     */
    self.setVolume = function (level) {
      if (!player || !player.supports('method', 'setVolume')) {
        return;
      }

      player.setVolume(level);
    };

    /**
     * Get list of available playback rates.
     *
     * @public
     * @returns {Array} available playback rates
     */
    self.getPlaybackRates = function () {
      if (!player) {
        return;
      }

      // Player.js doesn't support playback rates, so send 1.
      return [1];
    };

    /**
     * Get current playback rate.
     *
     * @public
     * @returns {Number} such as 0.25, 0.5, 1, 1.25, 1.5 and 2
     */
    self.getPlaybackRate = function () {
      if (!player) {
        return;
      }

      // Player.js doesn't support playback rates, so send 1.
      return 1;
    };

    /**
     * Set current playback rate.
     * Listen to event "playbackRateChange" to check if successful.
     *
     * @public
     * @params {Number} suggested rate that may be rounded to supported values
     */
    self.setPlaybackRate = function (newPlaybackRate) {
      // Player.js doesn't support playback rates, so do nothing
    };

    /**
     * Set current captions track.
     *
     * @param {H5P.Video.LabelValue} Captions track to show during playback
     */
    self.setCaptionsTrack = function (track) {
      // Player.js doesn't support captions track calls
    };

    /**
     * Figure out which captions track is currently used.
     *
     * @return {H5P.Video.LabelValue} Captions track
     */
    self.getCaptionsTrack = function () {
      // Player.js doesn't support captions track calls
    };

    // Respond to resize events by setting the player size.
    self.on('resize', function () {
      if (!$wrapper.is(':visible')) {
        return;
      }

      if (!player) {
        // Player isn't created yet. Try again.
        create();
        return;
      }

      // Use as much space as possible
      $wrapper.css({
        width: '100%',
        height: '100%'
      });

      var width = $wrapper[0].clientWidth;
      var height = options.fit ? $wrapper[0].clientHeight : ((width * (9/16)) + 8);
      
      // Validate height before setting
      if (height > 0) {
        $('#'+id).width(width);
        $('#'+id).height(height);
      }
    });
  }

  /**
   * Check to see if we can play any of the given sources.
   *
   * @public
   * @static
   * @param {Array} sources
   * @returns {Boolean}
   */
  Medial.canPlay = function (sources) {
    return getId(sources[0].path);
  };

  /**
   * Find id of Medial video from given URL.
   *
   * @private
   * @param {String} url
   * @returns {String} Medial video identifier
   */

  var getId = function (url) {
    // MEDIAL is self hosted so there is no consistent domain to match here. So look for a URL that is characteristic of MEDIAL
    url = new URL(url);
    var split = url.pathname.split('/');

    if (split.length == 3 && split[1] == "Player") {
      return split[2];
    }
  };


  var getPath = function (url) {
    url = new URL(url);
    var split = url.pathname.split('/');
    return url.protocol+'//'+url.host+'/player?autostart=n&videoId='+split[2]+'&captions=y&chapterId=0&playerJs=n';
  }

  /** @private */
  var numInstances = 0;

  // Extract the current origin (used for security)
  var ORIGIN = window.location.href.match(/http[s]?:\/\/[^\/]+/);
  ORIGIN = !ORIGIN || ORIGIN[0] === undefined ? undefined : ORIGIN[0];
  // ORIGIN = undefined is needed to support fetching file from device local storage

  return Medial;
})(H5P.jQuery);

// Register video handler
H5P.videoHandlers = H5P.videoHandlers || [];
H5P.videoHandlers.push(H5P.VideoMedial);
