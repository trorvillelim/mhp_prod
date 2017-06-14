export AWS_DEFAULT_REGION=us-east-1

mkdir /opt/mhp/node_modules
chown -R nodejs:nodejs /opt/mhp/node_modules

mkdir /opt/mhp/public/app/bower_components
chown -R nodejs:nodejs /opt/mhp/public/app/bower_components

su - nodejs -c "cd /opt/mhp && npm install"
su - nodejs -c "cd /opt/mhp && bower install"
su - nodejs -c "cd /opt/mhp && npm install pm2 -g"

cd /opt/mhp

aws rds describe-db-instances --query "DBInstances[*].DBInstanceIdentifier" | jq '.[]' |sed -e 's/^"//' -e 's/"$//' > file.txt
while read in; do 
	status=$(aws rds list-tags-for-resource --resource-name arn:aws:rds:us-east-1:366306727071:db:"$in" --query "TagList[?Key=='mhp:database:"$MHP_ENVIRONMENT"'].Value" | jq '.[0]');
	if [ "$status" = "\"true\"" ]; then MSSQL_HOSTNAME=$(aws rds describe-db-instances --db-instance-identifier "$in" --query "DBInstances[*].Endpoint.Address" | jq '.[0]'); fi
done < file.txt
echo "$MSSQL_HOSTNAME"

MHP_ENVIRONMENT_LOWER=$(echo $MHP_ENVIRONMENT | tr A-Z a-z) 

cat conf.json | jq '.config.server='$MSSQL_HOSTNAME | jq '.config.user='\"$MSSQL_USER\" | jq '.config.password='\"$MSSQL_PASSWORD\" | jq '.config.database="mHPWeb-'$MHP_ENVIRONMENT\" > conf1.json
cat conf1.json | jq '.keys.REGION='\"$AWS_DEFAULT_REGION\" | jq '.keys.SNS_KEY_ID=""' | jq '.keys.SNS_ACCESS_KEY=""' | jq '.keys.APP_ARN="arn:aws:sns:us-east-1:366306727071:app/'$MHP_APNS_APP\" > conf2.json
cat conf2.json | jq '.mhpURL="https://'$MHP_ENVIRONMENT_LOWER'.mhealthpharma.com"' > conf.json
rm -f conf1.json
rm -f conf2.json