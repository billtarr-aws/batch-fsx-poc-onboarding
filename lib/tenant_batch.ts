import * as cdk from '@aws-cdk/core';
import * as batch from "@aws-cdk/aws-batch";

interface BatchTenantStackProps extends cdk.NestedStackProps {
  tenant: string;
}

const gpuJobDefinitionName = "gpu-job-definition-";

const jobDefinitionName = "job-definition-";

class BatchTenantStack extends cdk.NestedStack {
  
  public readonly gpuJobDefinitionArn: string;
  public readonly jobDefinitionArn: string;
  public readonly mountPoint = "/mnt/workload";

  constructor(scope: cdk.Construct, id: string, props: BatchTenantStackProps) {

    super(scope, id, props);

    const jobDefinition = new batch.CfnJobDefinition(this, jobDefinitionName, {
      jobDefinitionName: jobDefinitionName + props.tenant,
      type: "Container",
      containerProperties: {
        volumes: [{
          host: {
            sourcePath: this.mountPoint + "/" + props.tenant + "/" // this mounts FSX at the tenant folder
          },
          name: 'Lustre'
        }],
        mountPoints: [{
          containerPath: this.mountPoint,
          sourceVolume: 'Lustre'
        }],
        image: "167965810206.dkr.ecr.us-west-2.amazonaws.com/cpu_app:latest",
        vcpus: 1,
        memory: 2048
      },
      retryStrategy: {
        attempts: 3
      },
      timeout: {
        attemptDurationSeconds: 60
      }
    });

    const gpuJobDefinition = new batch.CfnJobDefinition(this, gpuJobDefinitionName, {
      jobDefinitionName: gpuJobDefinitionName + props.tenant,
      type: "Container",
      containerProperties: {
        resourceRequirements: [{
          type: 'GPU', // here is where this job definition differs
          value: '1'
        }],
        volumes: [{
          host: {
            sourcePath: this.mountPoint + "/" + props.tenant + "/" // this mounts FSX at the tenant folder
          },
          name: 'Lustre'
        }],
        mountPoints: [{
          containerPath: this.mountPoint,
          sourceVolume: 'Lustre'
        }],
        image: "167965810206.dkr.ecr.us-west-2.amazonaws.com/gpu_app:latest", // CUDA based image
        vcpus: 1,
        memory: 2048
      },
      retryStrategy: {
        attempts: 3
      },
      timeout: {
        attemptDurationSeconds: 60
      }
    });

    this.jobDefinitionArn = jobDefinition.ref;
    this.gpuJobDefinitionArn = gpuJobDefinition.ref;

  }
}

export default BatchTenantStack;