1. Check whether .zip file has been uploaded to S3
2. If not uploaded, upload .zip file to S3, and then create an application version for the specified application with the .zip file.
3. Check the environment status (check whether the environment has been created)
4. If environment already exists, then check whether DNS exists, then create environment, then wait for the environment status is not 'Launching'
5. If environment does not exist, then update environment to use new application version, then wait for the environment status is not 'Updating'
6. Wait until environment status is Healthy
7. return deployment info
