export AWS_DEFAULT_REGION=us-east-1

instance_id=$(curl -m 5 -s http://169.254.169.254/latest/meta-data/instance-id)

aws elb describe-load-balancers --query "LoadBalancerDescriptions[*].LoadBalancerName" | jq '.[]' |sed -e 's/^"//' -e 's/"$//' > file.txt

while read in; do
        status=$(aws elb describe-tags --load-balancer-name "$in" --query "TagDescriptions[*].Tags[?Key=='mhp:nodejs-load-balancer:"$MHP_ENVIRONMENT"'].Value" | jq '.[0][0]');
        if [ "$status" = "\"true\"" ]
           then
               aws elb deregister-instances-from-load-balancer --load-balancer-name "$in" --instances "$instance_id"
        fi
done < file.txt

su - nodejs -c "cd /opt/mhp && pm2 stop Mhp-NodeJS-API"