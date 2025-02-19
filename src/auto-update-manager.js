const { Emitter, CompositeDisposable } = require('event-kit');

class AutoUpdateManager {
  /**
   * @param {Object} dependencies - Dependencies for the AutoUpdateManager.
   * @param {Object} dependencies.applicationDelegate - Delegate to handle application-specific update logic.
   * @param {string} dependencies.releaseChannel - The release channel (e.g., 'stable', 'dev').
   */
  constructor({ applicationDelegate, releaseChannel }) {
    if (!applicationDelegate || typeof applicationDelegate.checkForUpdate !== 'function') {
      throw new Error('applicationDelegate is required and must implement necessary methods');
    }

    this.applicationDelegate = applicationDelegate;
    this.releaseChannel = releaseChannel;
    this.subscriptions = new CompositeDisposable();
    this.emitter = new Emitter();
  }

  /**
   * Initializes event listeners for update-related events.
   */
  initialize() {
    this._forwardEvent('DidBeginCheckingForUpdate');
    this._forwardEvent('DidBeginDownloadingUpdate');
    this._forwardEvent('DidCompleteDownloadingUpdate');
    this._forwardEvent('UpdateNotAvailable');
    this._forwardEvent('UpdateError');
  }

  /**
   * Forwards an event from the applicationDelegate to the emitter.
   * @param {string} eventName - The name of the event to forward.
   */
  _forwardEvent(eventName) {
    const delegateEvent = `on${eventName}`;
    if (typeof this.applicationDelegate[delegateEvent] === 'function') {
      this.subscriptions.add(
        this.applicationDelegate[delegateEvent]((...args) => {
          this.emitter.emit(eventName.toLowerCase(), ...args);
        })
      );
    } else {
      console.warn(`applicationDelegate does not implement ${delegateEvent}`);
    }
  }

  /**
   * Checks for updates.
   */
  checkForUpdate() {
    try {
      this.applicationDelegate.checkForUpdate();
    } catch (error) {
      this.emitter.emit('update-error', error);
    }
  }

  /**
   * Restarts the application and installs the update.
   */
  restartAndInstallUpdate() {
    try {
      this.applicationDelegate.restartAndInstallUpdate();
    } catch (error) {
      this.emitter.emit('update-error', error);
    }
  }

  /**
   * Returns the current state of the AutoUpdateManager.
   * @returns {string} - The current state.
   */
  getState() {
    return this.applicationDelegate.getAutoUpdateManagerState();
  }

  /**
   * Returns the error message if an update error occurred.
   * @returns {string} - The error message.
   */
  getErrorMessage() {
    return this.applicationDelegate.getAutoUpdateManagerErrorMessage();
  }

  /**
   * Checks if the platform supports updates.
   * @returns {boolean} - True if updates are supported, false otherwise.
   */
  platformSupportsUpdates() {
    return this.releaseChannel !== 'dev' && this.getState() !== 'unsupported';
  }

  /**
   * Registers a callback for the 'did-begin-checking-for-update' event.
   * @param {Function} callback - The callback to register.
   * @returns {Disposable} - A disposable to unsubscribe the callback.
   */
  onDidBeginCheckingForUpdate(callback) {
    return this.emitter.on('did-begin-checking-for-update', callback);
  }

  /**
   * Registers a callback for the 'did-begin-downloading-update' event.
   * @param {Function} callback - The callback to register.
   * @returns {Disposable} - A disposable to unsubscribe the callback.
   */
  onDidBeginDownloadingUpdate(callback) {
    return this.emitter.on('did-begin-downloading-update', callback);
  }

  /**
   * Registers a callback for the 'did-complete-downloading-update' event.
   * @param {Function} callback - The callback to register.
   * @returns {Disposable} - A disposable to unsubscribe the callback.
   */
  onDidCompleteDownloadingUpdate(callback) {
    return this.emitter.on('did-complete-downloading-update', callback);
  }

  /**
   * Registers a callback for the 'update-not-available' event.
   * @param {Function} callback - The callback to register.
   * @returns {Disposable} - A disposable to unsubscribe the callback.
   */
  onUpdateNotAvailable(callback) {
    return this.emitter.on('update-not-available', callback);
  }

  /**
   * Registers a callback for the 'update-error' event.
   * @param {Function} callback - The callback to register.
   * @returns {Disposable} - A disposable to unsubscribe the callback.
   */
  onUpdateError(callback) {
    return this.emitter.on('update-error', callback);
  }

  /**
   * Returns the current platform.
   * @returns {string} - The platform (e.g., 'win32', 'darwin', 'linux').
   */
  getPlatform() {
    return process.platform;
  }

  /**
   * Cleans up resources and disposes of subscriptions.
   */
  destroy() {
    this.subscriptions.dispose();
    this.emitter.dispose();
  }
}

module.exports = AutoUpdateManager;
