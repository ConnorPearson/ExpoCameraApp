# Welcome to ExpoCameraApp

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Configure app API settings

In the app navigate to the 'Settings' tab and enter a server address to post to.

With `multipart` selected as the default method the app will post to `{API}/upload/multipart`. For base64 it will upload to `{API}/upload/base64`.

Use the test server in `image-upload-server/` on localhost to test the app. With image-upload-server running you can enter `http://x.x.x.x:3000` in ther server settings where `x.x.x.x` is the local IP address of the machine hostin the nodejs server.


## Run the image-upload-server for testing image posts

1. Open a terminal and navigate to the server folder.

   ```bash
   cd image-upload-server/
   ```

2. Run the nodejs server.

   ```bash
   node server.js
   ```
3. Capture a picture and post it via the app and monitor the server terminal output and `uploads` folder for received images.

## Video Demonstration

Here’s a demonstration of the app:

<video width="320" height="720" controls>
  <source src="https://raw.githubusercontent.com/ConnorPearson/ExpoCameraApp/refs/heads/master/examples/screen-20250326-215517.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>


## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
