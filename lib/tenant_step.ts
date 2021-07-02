import * as cdk from "@aws-cdk/core";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as tasks from "@aws-cdk/aws-stepfunctions-tasks";
import * as lambda from '@aws-cdk/aws-lambda';
import BatchTenantStack from "./tenant_batch";

interface StepTenantStackProps extends cdk.NestedStackProps {
    tenant: string,
    batch: BatchTenantStack;
  }

class StepTenantStack extends cdk.NestedStack {

  public readonly stateMachineArn: string;

  constructor(scope: cdk.Construct, id: string, props: StepTenantStackProps) {
    super(scope, id);

    const jobQueueArn = cdk.Fn.importValue('jobQueueArn');
    const gpuJobQueueArn = cdk.Fn.importValue('gpuJobQueueArn');
    const drtCreateFunctionArn = cdk.Fn.importValue('drtCreateFunctionArn');

    const batchSubmit = new tasks.BatchSubmitJob(this,"process data", {
        integrationPattern: sfn.IntegrationPattern.RUN_JOB,
        attempts: 3,
        jobDefinitionArn: props.batch.jobDefinitionArn,
        jobName: 'process-data',
        jobQueueArn: jobQueueArn,
        payload: sfn.TaskInput.fromObject({
          'tenant': props.tenant
        })
        //inputPath: '$',
        //resultPath: sfn.JsonPath.DISCARD,
    })

    const gpuBatchSubmit = new tasks.BatchSubmitJob(this,"GPU process data", {
      integrationPattern: sfn.IntegrationPattern.RUN_JOB,
      attempts: 3,
      jobDefinitionArn: props.batch.gpuJobDefinitionArn,
      jobName: 'gpu-process-data',
      jobQueueArn: gpuJobQueueArn,
      payload: sfn.TaskInput.fromObject({
        'tenant': props.tenant
      })
      //inputPath: '$',
      //resultPath: sfn.JsonPath.DISCARD,
    })

    const drtCreateFunction = lambda.Function.fromFunctionArn(this, 'drtCreateFunction', drtCreateFunctionArn);

    const drtLambda = new tasks.LambdaInvoke(this, "Sync FSx to S3", {
      lambdaFunction: drtCreateFunction,
      invocationType: tasks.LambdaInvocationType.EVENT,
      payload: sfn.TaskInput.fromObject({
        'tenant': props.tenant
      })
      //inputPath: '$'
    })

    const chain = sfn.Chain
      .start(batchSubmit)
      .next(gpuBatchSubmit)
      .next(drtLambda);

    const stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      stateMachineName: 'StateMachine' + props.tenant,
      definition: chain,
      //timeout: cdk.Duration.seconds(1200)
    });

    this.stateMachineArn = stateMachine.stateMachineArn;
  }
}

export default StepTenantStack;