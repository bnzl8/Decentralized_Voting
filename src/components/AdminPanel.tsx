import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Divider,
} from '@chakra-ui/react';
import { useWeb3 } from '../contexts/Web3Context';

interface Poll {
  id: number;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  options: string[];
}

const AdminPanel: React.FC = () => {
  const { whitelistContract, votingContract } = useWeb3();
  const toast = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [pollTitle, setPollTitle] = useState('');
  const [pollDescription, setPollDescription] = useState('');
  const [pollStartDate, setPollStartDate] = useState('');
  const [pollStartTime, setPollStartTime] = useState('');
  const [pollEndDate, setPollEndDate] = useState('');
  const [pollEndTime, setPollEndTime] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Add function to convert date and time to Unix timestamp
  const dateTimeToTimestamp = (date: string, time: string): number => {
    const combined = new Date(date + 'T' + time);
    return Math.floor(combined.getTime() / 1000);
  };

  // Add function to convert Unix timestamp to date and time strings
  const timestampToDateTime = (timestamp: number): { date: string; time: string } => {
    const date = new Date(timestamp * 1000);
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().split(' ')[0].slice(0, 5)
    };
  };

  // Add function to get minimum date (today)
  const getMinDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Add function to validate dates
  const validateDates = (startTimestamp: number, endTimestamp: number): string | null => {
    const now = Math.floor(Date.now() / 1000);
    
    if (startTimestamp <= now) {
      return 'Start time must be in the future';
    }
    
    if (endTimestamp <= startTimestamp) {
      return 'End time must be after start time';
    }
    
    return null;
  };

  useEffect(() => {
    loadPolls();
  }, [votingContract]);

  const loadPolls = async () => {
    if (!votingContract) return;

    try {
      const count = await votingContract.getPollsCount();
      const pollsData: Poll[] = [];

      for (let i = 0; i < count; i++) {
        const info = await votingContract.getPollInfo(i);
        pollsData.push({
          id: i,
          title: info[0],
          description: info[1],
          startTime: Number(info[2]),
          endTime: Number(info[3]),
          isActive: info[4],
          options: info[5],
        });
      }

      setPolls(pollsData);
    } catch (error) {
      console.error('Error loading polls:', error);
      toast({
        title: 'Error',
        description: 'Failed to load polls',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddToWhitelist = async () => {
    if (!whitelistContract || !newAddress) return;

    try {
      const tx = await whitelistContract.addToWhitelist(newAddress);
      await tx.wait();
      toast({
        title: 'Success',
        description: 'Address added to whitelist',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNewAddress('');
    } catch (error) {
      console.error('Error adding to whitelist:', error);
      toast({
        title: 'Error',
        description: 'Failed to add address to whitelist',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCreatePoll = async () => {
    if (!votingContract || !pollTitle || !pollDescription || pollOptions.length < 2) return;

    try {
      // Convert date and time to timestamps
      const startTimestamp = dateTimeToTimestamp(pollStartDate, pollStartTime);
      const endTimestamp = dateTimeToTimestamp(pollEndDate, pollEndTime);
      
      // Validate dates
      const validationError = validateDates(startTimestamp, endTimestamp);
      if (validationError) {
        toast({
          title: 'Error',
          description: validationError,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Filter out empty options
      const validOptions = pollOptions.filter(option => option.trim() !== '');
      if (validOptions.length < 2) {
        toast({
          title: 'Error',
          description: 'Poll must have at least 2 non-empty options',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const duration = endTimestamp - startTimestamp;

      console.log('Creating poll with parameters:', {
        title: pollTitle,
        description: pollDescription,
        startTime: startTimestamp,
        duration: duration,
        options: validOptions
      });

      const tx = await votingContract.createPoll(
        pollTitle,
        pollDescription,
        startTimestamp,
        duration,
        validOptions
      );

      console.log('Transaction sent:', tx.hash);
      await tx.wait();
      
      toast({
        title: 'Success',
        description: 'Poll created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setPollTitle('');
      setPollDescription('');
      setPollStartDate('');
      setPollStartTime('');
      setPollEndDate('');
      setPollEndTime('');
      setPollOptions(['', '']);
      
      // Reload polls
      loadPolls();
    } catch (error) {
      console.error('Error creating poll:', error);
      let errorMessage = 'Failed to create poll';
      
      if (error instanceof Error) {
        if (error.message.includes('execution reverted')) {
          const revertReason = error.message.match(/reason="([^"]+)"/)?.[1];
          if (revertReason) {
            errorMessage = revertReason;
          }
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEndPoll = async (pollId: number) => {
    if (!votingContract) return;

    try {
      const tx = await votingContract.endPoll(pollId);
      await tx.wait();
      toast({
        title: 'Success',
        description: 'Poll ended successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadPolls();
    } catch (error) {
      console.error('Error ending poll:', error);
      toast({
        title: 'Error',
        description: 'Failed to end poll',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const addPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Add function to check if poll is truly active
  const isPollActive = (poll: Poll) => {
    const currentTime = Math.floor(Date.now() / 1000);
    return poll.isActive && 
           currentTime >= poll.startTime && 
           currentTime <= poll.endTime;
  };

  // Add function to get poll status text
  const getPollStatus = (poll: Poll) => {
    const currentTime = Math.floor(Date.now() / 1000);
    if (!poll.isActive) return "Ended";
    if (currentTime < poll.startTime) return "Not Started";
    if (currentTime > poll.endTime) return "Time Expired";
    return "Active";
  };

  return (
    <Box>
      <Tabs>
        <TabList>
          <Tab>Manage Polls</Tab>
          <Tab>Whitelist Management</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="md" mb={4}>Create New Poll</Heading>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Title</FormLabel>
                    <Input
                      value={pollTitle}
                      onChange={(e) => setPollTitle(e.target.value)}
                      placeholder="Enter poll title"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={pollDescription}
                      onChange={(e) => setPollDescription(e.target.value)}
                      placeholder="Enter poll description"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Start Date and Time</FormLabel>
                    <Box display="flex" gap={4}>
                      <Input
                        type="date"
                        value={pollStartDate}
                        min={getMinDate()}
                        onChange={(e) => setPollStartDate(e.target.value)}
                      />
                      <Input
                        type="time"
                        value={pollStartTime}
                        onChange={(e) => setPollStartTime(e.target.value)}
                      />
                    </Box>
                  </FormControl>

                  <FormControl>
                    <FormLabel>End Date and Time</FormLabel>
                    <Box display="flex" gap={4}>
                      <Input
                        type="date"
                        value={pollEndDate}
                        min={pollStartDate || getMinDate()}
                        onChange={(e) => setPollEndDate(e.target.value)}
                      />
                      <Input
                        type="time"
                        value={pollEndTime}
                        onChange={(e) => setPollEndTime(e.target.value)}
                      />
                    </Box>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Options</FormLabel>
                    <VStack spacing={2}>
                      {pollOptions.map((option, index) => (
                        <Input
                          key={index}
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                      <Button onClick={addPollOption}>Add Option</Button>
                    </VStack>
                  </FormControl>

                  <Button
                    colorScheme="blue"
                    onClick={handleCreatePoll}
                    isDisabled={
                      !pollTitle || 
                      !pollDescription || 
                      !pollStartDate || 
                      !pollStartTime || 
                      !pollEndDate || 
                      !pollEndTime || 
                      pollOptions.length < 2
                    }
                  >
                    Create Poll
                  </Button>
                </VStack>
              </Box>

              <Divider />

              <Box>
                <Heading size="md" mb={4}>Active Polls</Heading>
                <VStack spacing={4} align="stretch">
                  {polls.map((poll) => (
                    <Box
                      key={poll.id}
                      p={4}
                      borderWidth={1}
                      borderRadius="md"
                      bg={isPollActive(poll) ? 'white' : 'gray.50'}
                    >
                      <Heading size="sm">{poll.title}</Heading>
                      <Text color="gray.600" mt={2}>{poll.description}</Text>
                      <Text fontSize="sm" mt={2}>
                        Status: {getPollStatus(poll)}
                      </Text>
                      <Text fontSize="sm">
                        Options: {poll.options.join(', ')}
                      </Text>
                      {isPollActive(poll) && (
                        <Button
                          colorScheme="red"
                          size="sm"
                          mt={2}
                          onClick={() => handleEndPoll(poll.id)}
                        >
                          End Poll
                        </Button>
                      )}
                      {poll.isActive && !isPollActive(poll) && (
                        <Button
                          colorScheme="orange"
                          size="sm"
                          mt={2}
                          onClick={() => handleEndPoll(poll.id)}
                        >
                          Close Expired Poll
                        </Button>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            </VStack>
          </TabPanel>

          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Box>
                <Heading size="md" mb={4}>Add to Whitelist</Heading>
                <VStack spacing={4}>
                  <FormControl>
                    <FormLabel>Ethereum Address</FormLabel>
                    <Input
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </FormControl>
                  <Button
                    colorScheme="blue"
                    onClick={handleAddToWhitelist}
                    isDisabled={!newAddress}
                  >
                    Add to Whitelist
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default AdminPanel; 