

const functions = require("firebase-functions");
// import * as admin from "firebase-admin";
// import * as functions from 'firebase-functions';
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
initializeApp();
const db = getFirestore();

const iot = require('@google-cloud/iot');
const client = new iot.v1.DeviceManagerClient();

const iot_core_region = `us-central1`;
const iot_core_registry = `my-registry`;
const iot_core_projectId = `gcpiot-358708`;
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });



// exports.helloPubSub = functions.pubsub.topic('my-device-events').onPublish((message) => {
//     // ...
//   });

exports.helloPubSub = functions.pubsub.topic('my-device-events').onPublish(
    async (message) => {
      const deviceId = message.attributes.deviceId;
      console.log(`message is `);
      console.log(message.json);
      // Write the device state into Firestore
    //   const deviceRef = functions.firestore.document("devices/test/" + deviceId);
      console.log(`deviceId is ${deviceId}`);
      try {
        // await deviceRef.onWrite(
        //     console.log(`deviceRef.onWrite triggered...`)
     
        // );
        const docRef = db.collection('devices').doc(deviceId);
        await docRef.set({
  
          'state': message.json,
          'online': true
        });
        console.log(`State updated for ${deviceId}`);
      } catch (error) {
        console.error(error);
      }
  }
);

// const doc = db.collection('device-configs').doc('{device}');

// const observer = doc.onSnapshot(docSnapshot => {
// // const observer = doc.onWrite(docSnapshot => {
//   console.log(`Received doc snapshot: ${docSnapshot}`);
//   // ...
// }, err => {
//   console.log(`Encountered error: ${err}`);
// });

exports.helloFirestoreWrite = functions.firestore.document('device-configs/{device}').onWrite(
    async (change, context) => {
            const deviceId = context.params.device;
            const config = change.after.data();
            console.log(`device-configs.onWrite triggered...${deviceId}`);
            console.log(config);      
          
            // Update IoT Core configuration
            // const parent = 'projects/gcpiot-358708/locations/us-central1';            
            const parent = `projects/${iot_core_projectId}/locations/${iot_core_region}`;
            // const devicePath = `${parent}/registries/my-registry`;
            const devicePath = `${parent}/registries/${iot_core_registry}`;
            // const request = generateRequest(context.params.deviceId, config, false);
            const request = {
                name: `${devicePath}/devices/${deviceId}`,
                binaryData: Buffer.from(JSON.stringify(config)).toString("base64"),
            };
       
            await client.modifyCloudToDeviceConfig(request);
            console.log(`Sent to CLOUD IOT...${deviceId}`);
        }
    );

    // function generateRequest(deviceId:string, configData:any, isBinary:Boolean) {
    //     const formattedName = client.devicePath(process.env.GCLOUD_PROJECT, functions.config().iot.core.region, functions.config().iot.core.registry, deviceId);
    //     let dataValue;
    //     if (isBinary) {
    //       const encoded = cbor.encode(configData);
    //       dataValue = encoded.toString("base64");
    //     } else {
    //       dataValue = Buffer.from(JSON.stringify(configData)).toString("base64");
    //     }
    //     return {
    //       name: formattedName,
    //       binaryData: dataValue
    //     };
    //   };
