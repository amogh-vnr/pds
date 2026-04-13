import torch
import torch.nn as nn
from torchvision import models

class CBAM(nn.Module):
    def __init__(self, ch, reduction=16):
        super().__init__()

        hidden = max(ch // reduction, 8)

        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)

        self.mlp = nn.Sequential(
            nn.Conv2d(ch, hidden, kernel_size=1, bias=False),
            nn.ReLU(inplace=True),
            nn.Conv2d(hidden, ch, kernel_size=1, bias=False)
        )

        self.ca_bn = nn.BatchNorm2d(ch)

        self.sa_conv = nn.Conv2d(2, 1, kernel_size=7, padding=3, bias=False)
        self.sa_bn = nn.BatchNorm2d(1)

        self.sigmoid = nn.Sigmoid()
        self.gamma = nn.Parameter(torch.tensor(1.0))

    def forward(self, x):
        identity = x

        avg_out = self.mlp(self.avg_pool(x))
        max_out = self.mlp(self.max_pool(x))
        ca = self.sigmoid(self.ca_bn(avg_out + max_out))
        x = x * ca

        avg = torch.mean(x, dim=1, keepdim=True)
        max_, _ = torch.max(x, dim=1, keepdim=True)
        sa = self.sigmoid(self.sa_bn(self.sa_conv(torch.cat([avg, max_], dim=1))))
        x = x * sa

        return identity + self.gamma * x


class ResNet50_CBAM_Binary(nn.Module):
    def __init__(self, n_classes=2):
        super().__init__()
        b = models.resnet50()

        self.stem = nn.Sequential(
            b.conv1, b.bn1, b.relu, b.maxpool
        )

        self.l1 = b.layer1
        self.l2 = b.layer2
        self.l3 = b.layer3
        self.l4 = b.layer4

        self.att1 = CBAM(256, reduction=8)
        self.att2 = CBAM(512, reduction=8)
        self.att3 = CBAM(1024, reduction=16)
        self.att4 = CBAM(2048, reduction=16)

        self.pool = nn.AdaptiveAvgPool2d(1)
        self.drop = nn.Dropout(0.3)
        self.fc = nn.Linear(2048, n_classes)

    def forward(self, x):
        x = self.stem(x)
        x = self.att1(self.l1(x))
        x = self.att2(self.l2(x))
        x = self.att3(self.l3(x))
        x = self.att4(self.l4(x))
        x = self.pool(x).flatten(1)
        x = self.drop(x)
        return self.fc(x)
