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
    var duration, position, volume, isMuted, buffered;
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

      element.on('load', loadPlayerJS);

      $placeholder.replaceWith(element);
    };

    
    var loadPlayerJS = function() {
      if (typeof playerjs == 'undefined') {
        window.document.body.appendChild(Object.assign(document.createElement('script'), {
          type: 'text/javascript',
          src: 'https://cdn.embed.ly/player-0.1.0.js',
          onload: () => playerJSLoaded()
         }));
      } else {
        playerJSLoaded();
      }

    };

    var timeupdate = function(data) {
      duration = data.duration;
      position = data.seconds;
    };

    var initialDuration = function(data) {
      player.off('timeupdate', initialDuration);
      // Put the player back to the start now that we (hopefuly) have the duration.
      player.setCurrentTime(0);
      player.pause();
      player.unmute();
      duration = data.duration;
      position = data.seconds;
      player.on('timeupdate', timeupdate);
      mutedCallbackWrapper(volumeCallbackWrapper);
      volumeCallbackWrapper(triggerh5p);
      setInterval(function() {
        mutedCallbackWrapper();
        volumeCallbackWrapper();
      }, 1500);

      // Handle playback state changes.
      player.on('play', () => self.trigger('stateChange', H5P.Video.PLAYING));
      player.on('pause', () => self.trigger('stateChange', H5P.Video.PAUSED));
      player.on('ended', () => self.trigger('stateChange', H5P.Video.ENDED));
    };

    var triggerh5p = function() {
      self.trigger('loaded');
      self.trigger('ready');
      // Trigger stateChange will cause the Interactive video overlay to be shown.
      self.trigger('stateChange');  
    };

    var playerJSLoaded = function() {
        player = new playerjs.Player(id);
        player.on('ready', function() {
          console.log('Player.js is ready');
          player.on('timeupdate', initialDuration);

          // Track the percentage of video that has finished loading (buffered).
          player.on('progress', (data) => {
            buffered = data.percent;
          });

          // play() won't play if called from the ready event, but we have to play to get the duration which H5P needs before it can be started
          player.mute();
          player.play();
          console.log('Player.js loaded');
        });
    };

    var volumeCallbackWrapper = async function(call) {
      const p = new Promise((resolve) => {
        player.getVolume((value) => {
            resolve(value);
        });
      });

      volume = await p;

      if (typeof call != 'undefined') {
          call();
      }
    };

    var mutedCallbackWrapper = async function(call) {
      const p = new Promise((resolve) => {
        player.getMuted((value) => {
            resolve(value);
        });
      });

      isMuted = await p;

      if (typeof call != 'undefined') {
          call();
      }
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

      // Pause the video when seeking, otherwise the H5P player seems to loose sync with MEDIAL when seeking backwards
      player.pause();
      player.setCurrentTime(time);
    };

    /**
     * Get elapsed time since video beginning.
     *
     * @public
     * @returns {Number}
     */
    self.getCurrentTime = function () {
      return position;
    };

    /**
     * Get total video duration time.
     *
     * @public
     * @returns {Number}
     */
    self.getDuration = function () {
      return duration;
    };

    /**
     * Get percentage of video that is buffered.
     *
     * @public
     * @returns {Number} Between 0 and 100
     */
    self.getBuffered = function () {
        return buffered;
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
      return isMuted;
    };

    /**
     * Return the video sound level.
     *
     * @public
     * @returns {Number} Between 0 and 100.
     */
    self.getVolume = function () {
      return volume;
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
    // MEDIAL is self hosted so there is no consistent domain to match here. So look for a URL that is characteristic of a share link
    url = new URL(url);
    var split = url.pathname.split('/');

    // Part 1 will be "Player", part two should be 8 alpha numeric characters.
    if (split.length == 3 && split[1] == "Player" && split[2].length == 8) {
      var pattern = new RegExp('^[a-zA-Z0-9]+$');
      if (pattern.test()) {
        return split[2];
      }
    }
  };


  var getPath = function (url) {
    url = new URL(url);
    var split = url.pathname.split('/');
    return url.protocol+'//'+url.host+'/player?autostart=n&videoId='+split[2]+'&captions=y&chapterId=0&playerJs=y&h5p=y';
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
