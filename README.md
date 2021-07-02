# AWS Batch, FSx for Lustre, Step Function PoC

Just an onboarding module to complement the Batch FSX PoC. This will
create a StepFunction and a Batch JobDefinition per tenant... There are
likely other ways this could work, like a single step function a lambda
that determines which JobDefinition to load

Follow the instructions in the infrastucture project first.

## Setup

Update "tenant_batch.ts" with your images

    aws ecr describe-repositories --query "repositories[?repositoryName=='cpu_app'].repositoryArn" --output text

line 153 - Replace the image value

    image: "123456789012.dkr.ecr.us-east-1.amazonaws.com/cpu_app:latest"

and the GPU image as well

    aws ecr describe-repositories --query "repositories[?repositoryName=='gpu_app'].repositoryArn" --output text

line 219 - Replace the image value

    image: "123456789012.dkr.ecr.us-east-1.amazonaws.com/gpu_app:latest"

## Deployment

    cdk bootstrap

## Onboard a Tenant

Use a context variable to onboard tenant1 and tenant2

    cdk deploy -c tenant=tenant1

    cdk deploy -c tenant=tenant2

## Execution

Retrieve the ARN of the Step Function from CloudFormation output:

    STEP_FUNCTION=$(aws cloudformation describe-stacks --stack-name tenantStack-tenant1 --query "Stacks[0].Outputs[?OutputKey=='stateMachineArn'].OutputValue" --output text)

Execute the step function:

    EXECUTION_ARN=$(aws stepfunctions start-execution --state-machine-arn $STEP_FUNCTION --query "executionArn" --output text)

Check the status:

    aws stepfunctions describe-execution --execution-arn $EXECUTION_ARN --query "status"

Once the status is "SUCCEEDED", we

Now repeat for tenant2

    STEP_FUNCTION=$(aws cloudformation describe-stacks --stack-name tenantStack-tenant2 --query "Stacks[0].Outputs[?OutputKey=='stateMachineArn'].OutputValue" --output text)

the Execute and Check status commands are the same.

## Teardown

    cdk destroy --force --c tenant=tenant1

    cdk destroy --force --c tenant=tenant2