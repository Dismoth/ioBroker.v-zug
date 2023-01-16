"use strict";

/*
 * Created with @iobroker/create-adapter v2.3.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const axios = require("axios").default;

// Load your modules here, e.g.:
// const fs = require("fs");

class VZug extends utils.Adapter {
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: "v-zug",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        let data;

        // Reset the connection indicator during startup
        this.setState("info.connection", false, true);

        const apiVersion = `http://${this.config.deviceIp}/ai?command=getAPIVersion`;
        try {
            let axiosReponse = await axios.get(apiVersion);
            if (axiosReponse.status === 200) {
                this.setState("info.connection", true, true);
                data = axiosReponse.data;
                this.log.info("api Version: " + data.value);

                await this.setObjectNotExistsAsync("info.apiVersion", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "state",
                        read: true,
                        write: false,
                        name: "Api Version"
                    },
                    native: {}
                });

                //now set the value of the state. Set 'ack' to true in order to show ioBroker that this data comes from the 'device'.
                await this.setStateAsync("info.apiVersion", data.value, true);

            } else {
                this.log.error("Could not retrieve data form device, status code " + axiosReponse.status);
            }

            const deviceStatus = `http://${this.config.deviceIp}/ai?command=getDeviceStatus`;
            this.log.info("url: " + deviceStatus);

            axiosReponse = await axios.get(deviceStatus);
            if (axiosReponse.status === 200) {
                data = axiosReponse.data;

                //create folder, ID should always be unique and constant for a certain device.
                await this.setObjectNotExistsAsync("device", {
                    type: "channel",
                    common: {
                        name: "Gerät"
                    },
                    native: {}
                });

                await this.setObjectNotExistsAsync("device.DeviceName", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "value",
                        read: true,
                        write: false,
                        name: "Geräte Name"
                    },
                    native: {}
                });

                await this.setObjectNotExistsAsync("device.Serial", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "value",
                        read: true,
                        write: false,
                        name: "Serienummer"
                    },
                    native: {}
                });

                await this.setObjectNotExistsAsync("device.Inactive", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "state",
                        read: true,
                        write: false,
                        name: "Ausgeschaltet"
                    },
                    native: {}
                });

                await this.setObjectNotExistsAsync("device.Program", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "value",
                        read: true,
                        write: false,
                        name: "Programm"
                    },
                    native: {}
                });

                await this.setObjectNotExistsAsync("device.Status", {
                    type: "state",
                    common: {
                        type: "string",
                        role: "state",
                        read: true,
                        write: false,
                        name: "Status"
                    },
                    native: {}
                });

                //now set the value of the states. Set 'ack' to true in order to show ioBroker that this data comes from the 'device'.
                await this.setStateAsync("device.DeviceName", data.DeviceName, true);
                await this.setStateAsync("device.Serial", data.Serial, true);
                await this.setStateAsync("device.Inactive", data.Inactive, true);
                await this.setStateAsync("device.Program", data.Program, true);
                await this.setStateAsync("device.Status", data.Status, true);

                this.log.info(data.ProgramEnd.EndType);

            } else {
                this.log.error("Could not retrieve data form device, status code " + axiosReponse.status);
            }

            /*
            let getCommand = `http://${this.config.deviceIp}/hh?command=getCommand`;

            this.log.info("getCommand: " + getCommand + "&value=ecomXstatXtotal");
            this.log.info("getCommand: " + getCommand + "&value=ecomXstatXavarage");
            */

            //http://192.168.200.50/ai?command=getLastPUSHNotifications

        } catch (e) {
            this.log.error("Could not retrieve data: " + e.message);
        }

        // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
        //this.subscribeStates("testVariable");
        // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
        //this.subscribeStates("lights.*");
        // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
        //this.subscribeStates("*");

        /*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/

        // the variable testVariable is set to true as command (ack=false)
        //await this.setStateAsync("testVariable", true);

        // same thing, but the value is flagged "ack"
        // ack should be always set to true if the value is received from or acknowledged from the target system
        //await this.setStateAsync("testVariable", { val: true, ack: true });

        // same thing, but the state is deleted after 30s (getState will return null afterwards)
        //await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

        // examples for the checkPassword/checkGroup functions
        //let result = await this.checkPasswordAsync("admin", "iobroker");
        //this.log.info("check user admin pw iobroker: " + result);

        //result = await this.checkGroupAsync("admin", "admin");
        //this.log.info("check group user admin group admin: " + result);

    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    //     if (typeof obj === "object" && obj.message) {
    //         if (obj.command === "send") {
    //             // e.g. send email or pushover or whatever
    //             this.log.info("send command");

    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
    //         }
    //     }
    // }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new VZug(options);
} else {
    // otherwise start the instance directly
    new VZug();
}
