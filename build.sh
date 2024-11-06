echo "Cleaning"
rm build.zip

echo "Compiling"
tsc

echo "Zipping"
zip -r build build

echo "Uploading"
git add .
git commit
git push origin main

echo "Done"
